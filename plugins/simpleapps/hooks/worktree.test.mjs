import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  childEnv,
  configuredBaseRef,
  create,
  main,
  nameProblem,
  remove,
  resolveLayout,
  sessionEnd,
  spawnPlan,
  subagentStop,
  systemDeps,
  workProblem,
} from "./worktree.mjs";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "worktree.mjs");
const PROJECT = "/project";
const REPO = join(PROJECT, "repo");
const LAYOUT = { CLAUDE_PROJECT_DIR: PROJECT };
const roots = [];

after(async () => {
  for (const root of roots) await rm(root, { recursive: true, force: true });
});

/** What an untouched detached worktree in a repo with an origin looks like. */
const DEFAULT_RESPONSES = {
  "symbolic-ref -q HEAD": { status: 1 },
  "symbolic-ref --short refs/remotes/origin/HEAD": { stdout: "origin/main\n" },
  "rev-parse --git-path FETCH_HEAD": { stdout: ".git/FETCH_HEAD\n" },
  "rev-parse --show-toplevel": { status: 128 },
};

/**
 * Fake side effects. `responses` maps a substring of the command line to the result it returns,
 * checked before DEFAULT_RESPONSES; unmatched commands succeed with no output.
 * `files` is what readText sees; writeText and copyFile record into `written` and `copied`, and
 * throw for a path listed in `failing`.
 * @param {{ existing?: string[], responses?: Record<string, object>, fetchedMsAgo?: number | null, files?: Record<string, string>, failing?: string[] }} [options]
 */
function fakeDeps({
  existing = [join(REPO, ".git")],
  responses = {},
  fetchedMsAgo = null,
  files = {},
  failing = [],
} = {}) {
  const calls = [];
  const options = [];
  /** @type {Record<string, string>} */
  const written = {};
  /** @type {string[]} */
  const copied = [];
  const find = (table, line) => Object.keys(table).find((pattern) => line.includes(pattern));
  const failFor = (/** @type {string} */ path) => {
    if (failing.includes(path)) throw new Error(`cannot write ${path}`);
  };
  return {
    calls,
    options,
    written,
    copied,
    exists: (/** @type {string} */ path) => existing.includes(path),
    modifiedMsAgo: () => fetchedMsAgo,
    readText: (/** @type {string} */ path) => files[path] ?? null,
    realPath: (/** @type {string} */ path) => path,
    writeText: (/** @type {string} */ path, /** @type {string} */ text) => {
      failFor(path);
      written[path] = text;
    },
    copyFile: (/** @type {string} */ from, /** @type {string} */ to) => {
      failFor(to);
      copied.push(`${from} -> ${to}`);
    },
    run: (
      /** @type {string} */ command,
      /** @type {string[]} */ args,
      /** @type {{ timeoutMs?: number } | undefined} */ runOptions,
    ) => {
      const line = [command, ...args].join(" ");
      calls.push(line);
      options.push(runOptions);
      const own = find(responses, line);
      const fallback = find(DEFAULT_RESPONSES, line);
      const response = own ? responses[own] : fallback ? DEFAULT_RESPONSES[fallback] : {};
      return { status: 0, stdout: "", stderr: "", ...response };
    },
  };
}

test("resolveLayout: a repo folder wins, then the project layout, then a repo above", () => {
  assert.deepEqual(resolveLayout(PROJECT, fakeDeps()), {
    repoDir: REPO,
    worktreesDir: join(PROJECT, "worktrees"),
  });
  // A plain repo that happens to contain repo/.git is still the plain repo
  const nested = fakeDeps({ existing: ["/plain/.git", "/plain/repo/.git"] });
  assert.deepEqual(resolveLayout("/plain", nested), {
    repoDir: "/plain",
    worktreesDir: join("/plain", ".claude", "worktrees"),
  });
  const subfolder = fakeDeps({
    existing: [],
    responses: { "--show-toplevel": { stdout: "/plain\n" } },
  });
  assert.equal(resolveLayout("/plain/src", subfolder)?.repoDir, "/plain");
  assert.equal(resolveLayout("/nothing", fakeDeps({ existing: [] })), null);
  const emptyTop = fakeDeps({ existing: [], responses: { "--show-toplevel": { stdout: "" } } });
  assert.equal(resolveLayout("/odd", emptyTop), null);
});

test("nameProblem allows only safe folder names", () => {
  for (const name of [undefined, "", 42]) assert.match(String(nameProblem(name)), /missing/);
  for (const name of [".", "a/b", "a\\b", "a..b", "-f", ".hidden", "a b", "a:b"]) {
    assert.match(String(nameProblem(name)), /MUST be letters/, name);
  }
  for (const name of ["feat-77", "agent-a1", "bold-oak-a3f2", "v1.2_x"]) {
    assert.equal(nameProblem(name), null);
  }
});

test("childEnv stops git prompting and keeps a user's own ssh command", () => {
  const env = childEnv({ PATH: "/bin" });
  assert.equal(env.PATH, "/bin");
  assert.equal(env.GIT_TERMINAL_PROMPT, "0");
  assert.equal(env.GIT_SSH_COMMAND, "ssh -o BatchMode=yes");
  assert.equal(childEnv({ GIT_SSH_COMMAND: "ssh -i key" }).GIT_SSH_COMMAND, "ssh -i key");
});

test("create makes a detached worktree from a bounded fetch of the default branch, then installs", () => {
  const path = join(PROJECT, "worktrees", "feat-77");
  const deps = fakeDeps({ existing: [join(REPO, ".git"), join(path, "pnpm-lock.yaml")] });
  assert.deepEqual(create({ name: "feat-77" }, LAYOUT, deps), {
    exitCode: 0,
    stdout: path,
    stderr: "",
  });
  assert.deepEqual(deps.calls, [
    `git -C ${REPO} symbolic-ref --short refs/remotes/origin/HEAD`,
    `git -C ${REPO} rev-parse --git-path FETCH_HEAD`,
    `git -C ${REPO} fetch -q origin main`,
    `git -C ${REPO} worktree add -q --detach ${path} origin/main`,
    `pnpm --dir ${path} install --frozen-lockfile`,
  ]);
  assert.deepEqual(deps.options[2], { timeoutMs: 10_000 });
});

test("create points shared lefthook hooks back at the main checkout after installing", () => {
  const path = join(PROJECT, "worktrees", "feat-77");
  const existing = [
    join(REPO, ".git"),
    join(path, "pnpm-lock.yaml"),
    join(REPO, "lefthook.yml"),
    join(REPO, "node_modules"),
  ];
  const deps = fakeDeps({ existing });
  assert.equal(create({ name: "feat-77" }, LAYOUT, deps).stderr, "");
  assert.equal(deps.calls.at(-1), `pnpm --dir ${REPO} exec lefthook install`);

  const failing = fakeDeps({
    existing,
    responses: { "exec lefthook": { status: 1, stderr: "x" } },
  });
  const warned = create({ name: "feat-77" }, LAYOUT, failing);
  assert.equal(warned.exitCode, 0);
  assert.match(String(warned.stderr), /git hooks may point at this worktree/);

  // No lefthook config, or the main checkout has no node_modules: nothing to restore
  const noConfig = fakeDeps({
    existing: existing.filter((file) => !file.endsWith("lefthook.yml")),
  });
  create({ name: "feat-77" }, LAYOUT, noConfig);
  assert.ok(!noConfig.calls.some((line) => line.includes("lefthook")));
  const noModules = fakeDeps({
    existing: existing.filter((file) => !file.endsWith("node_modules")),
  });
  create({ name: "feat-77" }, LAYOUT, noModules);
  assert.ok(!noModules.calls.some((line) => line.includes("lefthook")));
});

test("configuredBaseRef reads worktree.baseRef: local, then project, then user settings", () => {
  const local = join(PROJECT, ".claude", "settings.local.json");
  const shared = join(PROJECT, ".claude", "settings.json");
  const user = join("/home/me", ".claude", "settings.json");
  const env = { HOME: "/home/me" };
  const head = JSON.stringify({ worktree: { baseRef: "head" } });
  const fresh = JSON.stringify({ worktree: { baseRef: "fresh" } });
  const read = (/** @type {Record<string, string>} */ files) =>
    configuredBaseRef(PROJECT, env, fakeDeps({ files }));

  assert.equal(read({}), "fresh");
  assert.equal(read({ [user]: head }), "head");
  assert.equal(read({ [user]: head, [shared]: fresh }), "fresh");
  assert.equal(read({ [shared]: fresh, [local]: head }), "head");
  // Broken JSON, a branch name, or no worktree key fall through to the next file
  assert.equal(
    read({ [local]: "{", [shared]: '{"worktree":{"baseRef":"dev"}}', [user]: head }),
    "head",
  );
  assert.equal(read({ [local]: "{}" }), "fresh");
  const configDir = { CLAUDE_CONFIG_DIR: "/cfg" };
  const cfgDeps = fakeDeps({ files: { "/cfg/settings.json": head } });
  assert.equal(configuredBaseRef(PROJECT, configDir, cfgDeps), "head");
  assert.equal(configuredBaseRef(PROJECT, {}, fakeDeps({ files: { [user]: head } })), "fresh");
});

test("create with worktree.baseRef head starts from local HEAD without fetching", () => {
  const settings = join(PROJECT, ".claude", "settings.json");
  const deps = fakeDeps({ files: { [settings]: '{"worktree":{"baseRef":"head"}}' } });
  const result = create({ name: "local" }, LAYOUT, deps);
  assert.equal(result.exitCode, 0);
  assert.equal(result.stderr, "");
  assert.match(deps.calls.at(-1) ?? "", /--detach \S+local HEAD$/);
  assert.ok(!deps.calls.some((line) => line.includes(" fetch ") || line.includes("origin/HEAD")));
});

test("create skips the fetch when the repo fetched within a day", () => {
  const recent = fakeDeps({ fetchedMsAgo: 60_000 });
  create({ name: "docs" }, LAYOUT, recent);
  assert.ok(!recent.calls.some((line) => line.includes(" fetch ")));
  const stale = fakeDeps({ fetchedMsAgo: 2 * 24 * 60 * 60 * 1000 });
  create({ name: "docs" }, LAYOUT, stale);
  assert.ok(stale.calls.some((line) => line.includes(" fetch ")));
  const unreadable = fakeDeps({
    fetchedMsAgo: 60_000,
    responses: { "--git-path": { status: 128 } },
  });
  create({ name: "docs" }, LAYOUT, unreadable);
  assert.ok(unreadable.calls.some((line) => line.includes(" fetch ")));
});

test("create warns but succeeds when fetch or install fails", () => {
  const path = join(PROJECT, "worktrees", "feat-77");
  const deps = fakeDeps({
    existing: [join(REPO, ".git"), join(path, "pnpm-lock.yaml")],
    responses: {
      " fetch ": { status: 1, stderr: "offline\n" },
      pnpm: { status: 1, stderr: "lockfile out of date\n" },
    },
  });
  const result = create({ name: "feat-77" }, LAYOUT, deps);
  assert.equal(result.exitCode, 0);
  assert.equal(result.stdout, path);
  assert.match(String(result.stderr), /fetch failed, using local origin\/main: offline/);
  assert.match(String(result.stderr), /pnpm install failed.*lockfile out of date/);
  const timedOut = create(
    { name: "x" },
    LAYOUT,
    fakeDeps({ responses: { " fetch ": { status: 1 } } }),
  );
  assert.match(String(timedOut.stderr), /fetch failed.*timed out/);
});

test("create falls back to origin/main, origin/master, then local HEAD with a warning", () => {
  const noRemoteHead = { "refs/remotes/origin/HEAD": { status: 128 } };
  const main = fakeDeps({ responses: noRemoteHead });
  create({ name: "x" }, LAYOUT, main);
  assert.match(main.calls.at(-1) ?? "", /--detach \S+ origin\/main$/);

  const master = fakeDeps({ responses: { ...noRemoteHead, "origin/main": { status: 1 } } });
  create({ name: "x" }, LAYOUT, master);
  assert.match(master.calls.at(-1) ?? "", /--detach \S+ origin\/master$/);

  const none = fakeDeps({ responses: { ...noRemoteHead, "--verify": { status: 1 } } });
  const result = create({ name: "agent-abc" }, LAYOUT, none);
  assert.equal(result.exitCode, 0);
  assert.match(String(result.stderr), /no origin default branch/);
  assert.match(none.calls.at(-1) ?? "", /--detach \S+agent-abc HEAD$/);
  assert.ok(!none.calls.some((line) => line.includes(" fetch ")));
});

test("create skips install for subagents and lockfile-less repos, using cwd without CLAUDE_PROJECT_DIR", () => {
  const agentPath = join(PROJECT, "worktrees", "agent-a1");
  const agent = fakeDeps({ existing: [join(REPO, ".git"), join(agentPath, "pnpm-lock.yaml")] });
  create({ name: "agent-a1" }, LAYOUT, agent);
  assert.ok(!agent.calls.some((line) => line.startsWith("pnpm")));
  const noLock = fakeDeps();
  assert.equal(create({ name: "docs", cwd: PROJECT }, {}, noLock).exitCode, 0);
  assert.ok(!noLock.calls.some((line) => line.startsWith("pnpm")));
});

test("create re-enters an existing worktree but refuses a folder that is not one", () => {
  const path = join(PROJECT, "worktrees", "kept");
  const kept = fakeDeps({ existing: [join(REPO, ".git"), path, join(path, ".git")] });
  assert.deepEqual(create({ name: "kept" }, LAYOUT, kept), {
    exitCode: 0,
    stdout: path,
    stderr: "",
  });
  assert.equal(kept.calls.length, 0);
  const stray = create(
    { name: "kept" },
    LAYOUT,
    fakeDeps({ existing: [join(REPO, ".git"), path] }),
  );
  assert.equal(stray.exitCode, 1);
  assert.match(String(stray.stderr), /is not a git worktree/);
});

test("create fails on a bad name, a missing repo, or a failed git worktree add", () => {
  assert.equal(create({ name: "../x" }, LAYOUT, fakeDeps()).exitCode, 1);
  const noRepo = create({ name: "x" }, { CLAUDE_PROJECT_DIR: "/elsewhere" }, fakeDeps());
  assert.equal(noRepo.exitCode, 1);
  assert.match(String(noRepo.stderr), /No git repo for worktrees at \/elsewhere/);
  assert.equal(create({ name: "x" }, {}, fakeDeps()).exitCode, 1);
  const failedAdd = create(
    { name: "x" },
    LAYOUT,
    fakeDeps({ responses: { "worktree add": { status: 128, stderr: "already exists\n" } } }),
  );
  assert.equal(failedAdd.exitCode, 1);
  assert.match(String(failedAdd.stderr), /git worktree add failed: already exists/);
});

test("workProblem names every kind of work a removal would lose", () => {
  const path = "/project/worktrees/x";
  assert.equal(workProblem(fakeDeps(), path), null);
  /** @type {Array<[Record<string, object>, RegExp]>} */
  const cases = [
    [{ "status --porcelain": { stdout: "?? new.txt\n" } }, /uncommitted or untracked/],
    [{ "rev-list": { stdout: "abc123\n" } }, /commits no branch or remote holds/],
    [
      { "symbolic-ref -q HEAD": { status: 0, stdout: "refs/heads/feature-x\n" } },
      /branch feature-x/,
    ],
    [{ "status --porcelain": { status: 128 } }, /could not be read/],
    [{ "rev-list": { status: 128 } }, /could not be read/],
    [{ "symbolic-ref -q HEAD": { status: 128 } }, /could not be read/],
  ];
  for (const [responses, expected] of cases) {
    assert.match(String(workProblem(fakeDeps({ responses }), path)), expected);
  }
});

test("remove checks for work first, never forces, and keeps the worktree on any doubt", () => {
  const path = join(PROJECT, "worktrees", "feat-77");
  const clean = fakeDeps();
  assert.deepEqual(remove({ worktree_path: path }, LAYOUT, clean), { exitCode: 0 });
  assert.equal(clean.calls.at(-1), `git -C ${REPO} worktree remove ${path}`);

  const committed = fakeDeps({ responses: { "rev-list": { stdout: "abc123\n" } } });
  const kept = remove({ worktree_path: path }, LAYOUT, committed);
  assert.equal(kept.exitCode, 1);
  assert.match(String(kept.stderr), /Kept .*commits no branch or remote holds/);
  assert.ok(!committed.calls.some((line) => line.includes("worktree remove")));

  const refused = fakeDeps({
    responses: { "worktree remove": { status: 128, stderr: "locked\n" } },
  });
  assert.match(String(remove({ worktree_path: path }, LAYOUT, refused).stderr), /Kept .*locked/);
  assert.equal(remove({}, LAYOUT, fakeDeps()).exitCode, 1);
  const noRepo = remove({ worktree_path: "/x" }, { CLAUDE_PROJECT_DIR: "/elsewhere" }, fakeDeps());
  assert.equal(noRepo.exitCode, 1);
});

test("subagentStop removes an unchanged subagent worktree and keeps one holding work", () => {
  const path = join(PROJECT, "worktrees", "agent-a1");
  const existing = [join(REPO, ".git"), path];
  const clean = fakeDeps({ existing });
  assert.deepEqual(subagentStop({ agent_id: "a1" }, LAYOUT, clean), { exitCode: 0 });
  assert.equal(clean.calls.at(-1), `git -C ${REPO} worktree remove ${path}`);

  const branched = fakeDeps({
    existing,
    responses: { "symbolic-ref -q HEAD": { status: 0, stdout: "refs/heads/x\n" } },
  });
  const kept = subagentStop({ agent_id: "a1" }, LAYOUT, branched);
  assert.equal(kept.exitCode, 0);
  assert.match(String(kept.stderr), /Kept .*branch x/);
  assert.ok(!branched.calls.some((line) => line.includes("worktree remove")));
});

test("subagentStop is a no-op without an agent id, a repo, or a worktree, and never fails", () => {
  assert.deepEqual(subagentStop({}, LAYOUT, fakeDeps()), { exitCode: 0 });
  const elsewhere = { CLAUDE_PROJECT_DIR: "/elsewhere" };
  assert.deepEqual(subagentStop({ agent_id: "a1" }, elsewhere, fakeDeps()), { exitCode: 0 });
  const noFolder = fakeDeps();
  assert.deepEqual(subagentStop({ agent_id: "a1" }, LAYOUT, noFolder), { exitCode: 0 });
  assert.equal(noFolder.calls.length, 0);
  const path = join(PROJECT, "worktrees", "agent-a1");
  const failed = subagentStop(
    { agent_id: "a1" },
    LAYOUT,
    fakeDeps({
      existing: [join(REPO, ".git"), path],
      responses: { "worktree remove": { status: 128, stderr: "locked\n" } },
    }),
  );
  assert.equal(failed.exitCode, 0);
  assert.match(String(failed.stderr), /Could not remove .*locked/);
});

test("spawnPlan starts commands directly, except non-git commands on Windows via a quoted shell line", () => {
  assert.deepEqual(spawnPlan("darwin", "pnpm", ["--dir", "/a b"]), {
    command: "pnpm",
    args: ["--dir", "/a b"],
    shell: false,
  });
  assert.deepEqual(spawnPlan("win32", "git", ["status"]), {
    command: "git",
    args: ["status"],
    shell: false,
  });
  assert.deepEqual(spawnPlan("win32", "pnpm", ["--dir", "C:\\a b", "install"]), {
    command: 'pnpm "--dir" "C:\\a b" "install"',
    args: [],
    shell: true,
  });
});

test("create records the session that made the worktree", () => {
  const gitDir = "/project/repo/.git/worktrees/feat-77";
  const responses = { "--absolute-git-dir": { stdout: `${gitDir}\n` } };
  const deps = fakeDeps({ responses });
  assert.equal(create({ name: "feat-77", session_id: "s1" }, LAYOUT, deps).stderr, "");
  assert.deepEqual(deps.written, { [join(gitDir, "claude-session")]: "s1" });

  const noGitDir = fakeDeps({ responses: { "--absolute-git-dir": { status: 128 } } });
  const warned = create({ name: "feat-77", session_id: "s1" }, LAYOUT, noGitDir);
  assert.match(String(warned.stderr), /could not record the session/);

  const unwritable = fakeDeps({ responses, failing: [join(gitDir, "claude-session")] });
  const failed = create({ name: "feat-77", session_id: "s1" }, LAYOUT, unwritable);
  assert.equal(failed.exitCode, 0);
  assert.match(String(failed.stderr), /could not record the session/);
});

test("re-entering a kept worktree records the new session as its owner", () => {
  const path = join(PROJECT, "worktrees", "kept");
  const gitDir = "/project/repo/.git/worktrees/kept";
  const existing = [join(REPO, ".git"), path, join(path, ".git")];
  const responses = { "--absolute-git-dir": { stdout: `${gitDir}\n` } };
  const deps = fakeDeps({ existing, responses });
  const reentered = create({ name: "kept", session_id: "s2" }, LAYOUT, deps);
  assert.deepEqual(reentered, { exitCode: 0, stdout: path, stderr: "" });
  assert.deepEqual(deps.written, { [join(gitDir, "claude-session")]: "s2" });

  const noGitDir = fakeDeps({ existing, responses: { "--absolute-git-dir": { status: 128 } } });
  const warned = create({ name: "kept", session_id: "s2" }, LAYOUT, noGitDir);
  assert.equal(warned.exitCode, 0);
  assert.match(String(warned.stderr), /could not record the session/);
});

test("create copies .worktreeinclude matches that are also gitignored", () => {
  const path = join(PROJECT, "worktrees", "feat-77");
  const existing = [join(REPO, ".git"), join(REPO, ".worktreeinclude")];
  const deps = fakeDeps({
    existing,
    failing: [join(path, "broken.env")],
    responses: {
      "ls-files": { stdout: ".env\nconfig/local.env\ntracked-looking.env\nbroken.env\n" },
      "check-ignore": { stdout: ".env\nconfig/local.env\nbroken.env\n" },
    },
  });
  const result = create({ name: "feat-77" }, LAYOUT, deps);
  assert.equal(result.exitCode, 0);
  assert.deepEqual(deps.copied, [
    `${join(REPO, ".env")} -> ${join(path, ".env")}`,
    `${join(REPO, "config/local.env")} -> ${join(path, "config/local.env")}`,
  ]);
  assert.match(String(result.stderr), /could not copy broken\.env/);
  assert.ok(
    deps.calls.includes(
      `git -C ${REPO} check-ignore -- .env config/local.env tracked-looking.env broken.env`,
    ),
  );

  const nothing = fakeDeps({ existing });
  create({ name: "feat-77" }, LAYOUT, nothing);
  assert.ok(!nothing.calls.some((line) => line.includes("check-ignore")));
  const noFile = fakeDeps();
  create({ name: "feat-77" }, LAYOUT, noFile);
  assert.ok(!noFile.calls.some((line) => line.includes("ls-files")));
});

test("sessionEnd removes this session's worktrees that hold no work, and nothing else", () => {
  const wt = (/** @type {string} */ name) => join(PROJECT, "worktrees", name);
  const listing = [REPO, ...["mine", "other", "dirty", "here", "stuck", "unknown"].map(wt)]
    .map((path) => `worktree ${path}\nHEAD abc\ndetached\n`)
    .join("\n");
  const gitDirFor = (/** @type {string} */ name) => ({
    [`-C ${wt(name)} rev-parse --absolute-git-dir`]: { stdout: `/gd/${name}\n` },
  });
  const deps = fakeDeps({
    responses: {
      "worktree list --porcelain": { stdout: `${listing}worktree /elsewhere/x\n` },
      ...gitDirFor("mine"),
      ...gitDirFor("other"),
      ...gitDirFor("dirty"),
      ...gitDirFor("here"),
      ...gitDirFor("stuck"),
      [`-C ${wt("unknown")} rev-parse --absolute-git-dir`]: { status: 128 },
      [`-C ${wt("dirty")} status --porcelain`]: { stdout: "?? x\n" },
      [`worktree remove ${wt("stuck")}`]: { status: 128, stderr: "locked\n" },
    },
    files: {
      "/gd/mine/claude-session": "s1\n",
      "/gd/other/claude-session": "s2",
      "/gd/dirty/claude-session": "s1",
      "/gd/here/claude-session": "s1",
      "/gd/stuck/claude-session": "s1",
    },
  });
  const cwd = join(wt("here"), "src");
  const result = sessionEnd({ session_id: "s1", reason: "other", cwd }, LAYOUT, deps);
  assert.equal(result.exitCode, 0);
  const removals = deps.calls.filter((line) => line.includes("worktree remove"));
  assert.deepEqual(removals, [
    `git -C ${REPO} worktree remove ${wt("mine")}`,
    `git -C ${REPO} worktree remove ${wt("stuck")}`,
  ]);
  assert.match(String(result.stderr), /Kept .*dirty: it has uncommitted/);
  assert.match(String(result.stderr), /Could not remove .*stuck: locked/);

  const quiet = fakeDeps({ responses: { "worktree list": { stdout: `worktree ${REPO}\n` } } });
  assert.deepEqual(sessionEnd({ session_id: "s1" }, LAYOUT, quiet), { exitCode: 0 });
});

test("sessionEnd does nothing without a session, on /clear or /resume, or without a repo", () => {
  for (const input of [
    {},
    { session_id: "s1", reason: "clear" },
    { session_id: "s1", reason: "resume" },
  ]) {
    const deps = fakeDeps();
    assert.deepEqual(sessionEnd(input, LAYOUT, deps), { exitCode: 0 });
    assert.equal(deps.calls.length, 0);
  }
  const elsewhere = { CLAUDE_PROJECT_DIR: "/elsewhere" };
  assert.deepEqual(sessionEnd({ session_id: "s1" }, elsewhere, fakeDeps()), { exitCode: 0 });
});

test("main dispatches events and rejects bad input", () => {
  assert.equal(main("bogus", "{}", LAYOUT, fakeDeps()).exitCode, 1);
  assert.match(String(main(undefined, "{}", LAYOUT, fakeDeps()).stderr), /Unknown event/);
  assert.match(String(main("create", "not json", LAYOUT, fakeDeps()).stderr), /not JSON/);
  assert.match(String(main("create", "null", LAYOUT, fakeDeps()).stderr), /missing/);
  assert.deepEqual(main("subagent-stop", "{}", LAYOUT, fakeDeps()), { exitCode: 0 });
  assert.deepEqual(main("session-end", "{}", LAYOUT, fakeDeps()), { exitCode: 0 });
});

test("systemDeps: process start failure, file age, text read and write, and copy into new folders", async () => {
  const result = systemDeps.run("definitely-not-a-command-gh77", []);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  const folder = await mkdtemp(join(tmpdir(), "worktree-age-"));
  roots.push(folder);
  await writeFile(join(folder, "f"), "");
  const age = systemDeps.modifiedMsAgo(join(folder, "f"));
  // mtime and Date.now() differ in precision, so a fresh file can read a few ms in the future
  assert.ok(age !== null && Math.abs(age) < 60_000);
  assert.equal(systemDeps.modifiedMsAgo(join(folder, "missing")), null);

  systemDeps.writeText(join(folder, "note"), "hello");
  assert.equal(systemDeps.readText(join(folder, "note")), "hello");
  assert.equal(systemDeps.readText(join(folder, "missing")), null);
  systemDeps.copyFile(join(folder, "note"), join(folder, "deep", "er", "note"));
  assert.equal(systemDeps.readText(join(folder, "deep", "er", "note")), "hello");
  assert.equal(systemDeps.realPath(join(folder, "missing")), join(folder, "missing"));
  assert.ok(systemDeps.realPath(folder).endsWith(folder.split("/").at(-1) ?? "?"));
});

/** Run one git command in `dir`, failing the test if it fails. */
function setupGit(dir, ...args) {
  const identity = ["-c", "user.name=test", "-c", "user.email=test@example.com"];
  const signing = ["-c", "commit.gpgsign=false"];
  const result = spawnSync("git", ["-C", dir, ...identity, ...signing, ...args], {
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
}

/** Run the hook script the way Claude Code does: event argument, JSON on stdin. */
function runHook(projectDir, event, input) {
  return spawnSync(process.execPath, [SCRIPT, event], {
    input: JSON.stringify(input),
    encoding: "utf8",
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
  });
}

test("end to end against a real git repo in the project layout", async () => {
  const projectDir = await mkdtemp(join(tmpdir(), "worktree-hook-"));
  roots.push(projectDir);
  const repoDir = join(projectDir, "repo");
  await mkdir(repoDir);
  setupGit(repoDir, "init", "-q");
  await writeFile(join(repoDir, ".gitignore"), ".env\n");
  await writeFile(join(repoDir, ".worktreeinclude"), ".env\n");
  await writeFile(join(repoDir, ".env"), "SECRET=1\n");
  setupGit(repoDir, "add", ".gitignore", ".worktreeinclude");
  setupGit(repoDir, "commit", "-q", "-m", "init");

  const named = runHook(projectDir, "create", { name: "feat-77", session_id: "s1" });
  assert.equal(named.status, 0, named.stderr);
  const namedPath = named.stdout.trim();
  assert.equal(namedPath, join(projectDir, "worktrees", "feat-77"));
  assert.equal(systemDeps.readText(join(namedPath, ".env")), "SECRET=1\n");

  // Session end removes this session's clean worktree, and leaves another session's alone
  assert.equal(runHook(projectDir, "create", { name: "theirs", session_id: "s2" }).status, 0);
  assert.equal(runHook(projectDir, "create", { name: "temp", session_id: "s1" }).status, 0);
  assert.equal(runHook(projectDir, "session-end", { session_id: "s1", reason: "other" }).status, 0);
  assert.ok(!existsSync(join(projectDir, "worktrees", "temp")));
  assert.ok(existsSync(join(projectDir, "worktrees", "theirs")));
  // feat-77 holds the gitignored .env only, which is not work: it went too, so recreate it
  assert.ok(!existsSync(namedPath));
  assert.equal(runHook(projectDir, "create", { name: "feat-77" }).status, 0);

  // Unchanged subagent worktree goes; the worktrees/ folder stays
  assert.equal(runHook(projectDir, "create", { name: "agent-a1" }).status, 0);
  assert.equal(runHook(projectDir, "subagent-stop", { agent_id: "a1" }).status, 0);
  assert.ok(!existsSync(join(projectDir, "worktrees", "agent-a1")));

  // A commit only the detached worktree holds MUST survive a remove request
  setupGit(namedPath, "commit", "-q", "--allow-empty", "-m", "unpushed work");
  const refused = runHook(projectDir, "remove", { worktree_path: namedPath });
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /commits no branch or remote holds/);
  assert.ok(existsSync(namedPath));

  // Once a branch holds the commit (the worktree itself stays detached), it can go
  setupGit(namedPath, "branch", "saved");
  const removed = runHook(projectDir, "remove", { worktree_path: namedPath });
  assert.equal(removed.status, 0, removed.stderr);
  assert.ok(!existsSync(namedPath));
  assert.ok(existsSync(join(projectDir, "worktrees")));

  const unknown = runHook(projectDir, "bogus", {});
  assert.equal(unknown.status, 1);
  assert.match(unknown.stderr, /Unknown event/);
});
