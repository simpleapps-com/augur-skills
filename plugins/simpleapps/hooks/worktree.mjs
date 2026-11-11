// Claude Code worktree hooks (GH #77). Places worktrees at {project}/worktrees/<name> in the
// SimpleApps layout ({project}/repo is the git repo), or <repo>/.claude/worktrees/<name> in a plain
// repo. Worktrees are detached (no local branch to clean up). Nothing is removed while it holds
// work (changes, untracked files, commits no branch or remote holds, or a checked-out branch), and
// nothing is ever removed with --force: Claude Code leaves that check to this hook.
//
// Each worktree records the session that made it, and session end removes that session's
// worktrees that hold no work, so worktrees made for workflow agents (whose folder names are not
// documented) do not pile up either.
//
// Usage (from hooks/hooks.json): node worktree.mjs <create|remove|subagent-stop|session-end>,
// hook JSON on stdin.

import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const DAY_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 10_000;
const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const SESSION_MARKER = "claude-session";

/**
 * @typedef {{ status: number, stdout: string, stderr: string }} RunResult
 * @typedef {{
 *   run: (command: string, args: string[], options?: { timeoutMs?: number }) => RunResult,
 *   exists: (path: string) => boolean,
 *   modifiedMsAgo: (path: string) => number | null,
 *   readText: (path: string) => string | null,
 *   writeText: (path: string, text: string) => void,
 *   copyFile: (from: string, to: string) => void,
 *   realPath: (path: string) => string,
 * }} Deps
 * @typedef {{ repoDir: string, worktreesDir: string }} Layout
 */

/**
 * How to start `command`: directly, except on Windows, where package managers are `.cmd` shims
 * that Node can start only through a shell, so the line is quoted and run by cmd.exe. git is a
 * real executable everywhere. The Windows branch is untested on Windows itself.
 * @param {string} platform
 * @param {string} command
 * @param {string[]} args
 */
export function spawnPlan(platform, command, args) {
  if (platform !== "win32" || command === "git") return { command, args, shell: false };
  const line = [command, ...args.map((arg) => `"${arg}"`)].join(" ");
  return { command: line, args: [], shell: true };
}

/**
 * Environment for child processes: git MUST NOT wait for a password, passphrase, or host-key
 * answer nobody can give. A user's own GIT_SSH_COMMAND is kept.
 * @param {Record<string, string | undefined>} env
 * @returns {Record<string, string | undefined>}
 */
export function childEnv(env) {
  return {
    ...env,
    GIT_TERMINAL_PROMPT: "0",
    GIT_SSH_COMMAND: env.GIT_SSH_COMMAND ?? "ssh -o BatchMode=yes",
  };
}

/** The real side effects; tests pass their own. @type {Deps} */
export const systemDeps = {
  run: (command, args, options = {}) => {
    const plan = spawnPlan(process.platform, command, args);
    const result = spawnSync(plan.command, plan.args, {
      encoding: "utf8",
      env: childEnv(process.env),
      shell: plan.shell,
      timeout: options.timeoutMs,
    });
    return { status: result.status ?? 1, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
  },
  exists: (path) => existsSync(path),
  modifiedMsAgo: (path) => {
    try {
      return Date.now() - statSync(path).mtimeMs;
    } catch {
      return null;
    }
  },
  readText: (path) => {
    try {
      return readFileSync(path, "utf8");
    } catch {
      return null;
    }
  },
  writeText: (path, text) => writeFileSync(path, text),
  /** Symlinks resolved, as git prints paths; the input unchanged when it does not exist. */
  realPath: (path) => {
    try {
      return realpathSync(path);
    } catch {
      return path;
    }
  },
  copyFile: (from, to) => {
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(from, to);
  },
};

/** @param {Deps} deps @param {string} dir @param {string[]} args @param {{ timeoutMs?: number }} [options] */
const git = (deps, dir, args, options) => deps.run("git", ["-C", dir, ...args], options);

/**
 * Where the git repo and its worktrees live for a project folder. A folder that is itself a repo
 * wins over a nested `repo/`, so a plain repo that happens to contain one is not misread.
 * @param {string} projectDir
 * @param {Deps} deps
 * @returns {Layout | null}
 */
export function resolveLayout(projectDir, deps) {
  const plain = (/** @type {string} */ repoDir) => ({
    repoDir,
    worktreesDir: join(repoDir, ".claude", "worktrees"),
  });
  if (deps.exists(join(projectDir, ".git"))) return plain(projectDir);
  if (deps.exists(join(projectDir, "repo", ".git"))) {
    return { repoDir: join(projectDir, "repo"), worktreesDir: join(projectDir, "worktrees") };
  }
  // A session started in a subfolder of a plain repo
  const top = git(deps, projectDir, ["rev-parse", "--show-toplevel"]);
  const topDir = top.stdout.trim();
  return top.status === 0 && topDir ? plain(topDir) : null;
}

/**
 * Why a worktree name is unsafe as a folder name, or null when it is fine.
 * @param {unknown} name
 */
export function nameProblem(name) {
  if (typeof name !== "string" || name === "") return "worktree name is missing";
  if (!NAME_PATTERN.test(name) || name.includes("..")) {
    return `worktree name "${name}" MUST be letters, digits, ".", "_" or "-", start with a letter or digit, and not contain ".."`;
  }
  return null;
}

/** Hook input and environment → the layout, or an error message. */
function layoutFor(input, env, deps) {
  const projectDir = env.CLAUDE_PROJECT_DIR || input.cwd;
  const layout = projectDir ? resolveLayout(projectDir, deps) : null;
  if (layout) return { layout, projectDir };
  return {
    error:
      `No git repo for worktrees at ${projectDir}: expected ${projectDir}/repo ` +
      "(SimpleApps project layout) or a git repo at or above the project folder.",
  };
}

/** The remote default branch (origin/HEAD, else origin/main or origin/master), or null. */
function remoteDefault(deps, repoDir) {
  const remoteHead = git(deps, repoDir, ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"]);
  if (remoteHead.status === 0) return remoteHead.stdout.trim();
  for (const ref of ["origin/main", "origin/master"]) {
    if (git(deps, repoDir, ["rev-parse", "--verify", "-q", ref]).status === 0) return ref;
  }
  return null;
}

/** Fetch `base` unless the repo fetched in the last day; bounded, and a failure only warns. */
function fetchIfStale(deps, repoDir, base, warnings) {
  const fetchHead = git(deps, repoDir, ["rev-parse", "--git-path", "FETCH_HEAD"]);
  const age = deps.modifiedMsAgo(resolve(repoDir, fetchHead.stdout.trim()));
  if (fetchHead.status === 0 && age !== null && age < DAY_MS) return;
  const branch = base.replace(/^origin\//, "");
  const fetch = git(deps, repoDir, ["fetch", "-q", "origin", branch], {
    timeoutMs: FETCH_TIMEOUT_MS,
  });
  if (fetch.status !== 0) {
    warnings.push(`fetch failed, using local ${base}: ${fetch.stderr.trim() || "timed out"}`);
  }
}

/** `worktree.baseRef` from one settings file's text, or null when unset, invalid, or unreadable. */
function baseRefIn(text) {
  if (!text) return null;
  try {
    const value = JSON.parse(text)?.worktree?.baseRef;
    return value === "fresh" || value === "head" ? value : null;
  } catch {
    return null;
  }
}

/**
 * Claude Code's `worktree.baseRef` setting ("fresh", the default, or "head"). Claude Code does not
 * pass it to a WorktreeCreate hook, so it is read here with Claude Code's precedence: local
 * project settings, then shared project settings, then user settings.
 * @param {string} projectDir
 * @param {Record<string, string | undefined>} env
 * @param {Deps} deps
 * @returns {"fresh" | "head"}
 */
export function configuredBaseRef(projectDir, env, deps) {
  const userDir = env.CLAUDE_CONFIG_DIR || (env.HOME ? join(env.HOME, ".claude") : null);
  const files = [
    join(projectDir, ".claude", "settings.local.json"),
    join(projectDir, ".claude", "settings.json"),
  ];
  if (userDir) files.push(join(userDir, "settings.json"));
  for (const file of files) {
    const value = baseRefIn(deps.readText(file));
    if (value) return value;
  }
  return "fresh";
}

/**
 * The ref a new worktree starts from. "fresh": the remote default branch, kept fresh, else local
 * HEAD. "head": the main checkout's current commit, so unpushed local commits come along.
 */
function baseRef(deps, repoDir, mode, warnings) {
  if (mode === "head") return "HEAD";
  const base = remoteDefault(deps, repoDir);
  if (!base) {
    warnings.push("no origin default branch found; starting from local HEAD");
    return "HEAD";
  }
  fetchIfStale(deps, repoDir, base, warnings);
  return base;
}

/**
 * Install dependencies so git hooks (lefthook) can run. Subagent worktrees skip it to stay fast;
 * the main session installs before testing or pushing from one.
 */
function installDependencies(deps, repoDir, name, path, warnings) {
  if (name.startsWith("agent-") || !deps.exists(join(path, "pnpm-lock.yaml"))) return;
  const install = deps.run("pnpm", ["--dir", path, "install", "--frozen-lockfile"]);
  if (install.status !== 0) {
    warnings.push(
      `pnpm install failed; run it in ${path} before committing: ${install.stderr.trim()}`,
    );
  }
  restoreGitHooks(deps, repoDir, warnings);
}

const LEFTHOOK_CONFIGS = ["lefthook.yml", "lefthook.yaml", ".lefthook.yml", ".lefthook.yaml"];

/**
 * The install's `prepare` script runs `lefthook install`, which points the shared
 * `.git/hooks` at this worktree's own lefthook binary; once the worktree is removed, every push
 * from the main checkout would look for a deleted file. Re-install from the main checkout.
 */
function restoreGitHooks(deps, repoDir, warnings) {
  const usesLefthook = LEFTHOOK_CONFIGS.some((file) => deps.exists(join(repoDir, file)));
  if (!usesLefthook || !deps.exists(join(repoDir, "node_modules"))) return;
  const reinstall = deps.run("pnpm", ["--dir", repoDir, "exec", "lefthook", "install"]);
  if (reinstall.status !== 0) {
    warnings.push(
      `git hooks may point at this worktree; run \`pnpm --dir ${repoDir} exec lefthook install\`: ${reinstall.stderr.trim()}`,
    );
  }
}

/** WorktreeCreate: stdout MUST be only the absolute worktree path. */
export function create(input, env, deps) {
  const problem = nameProblem(input.name);
  if (problem) return { exitCode: 1, stderr: problem };
  const { layout, projectDir, error } = layoutFor(input, env, deps);
  if (!layout) return { exitCode: 1, stderr: error };

  const path = join(layout.worktreesDir, input.name);
  if (deps.exists(path)) {
    // A kept worktree being re-entered (e.g. `claude -w <name>` again); anything else is refused
    if (!deps.exists(join(path, ".git"))) {
      return { exitCode: 1, stderr: `${path} exists and is not a git worktree` };
    }
    // The re-entering session now owns it, so the session that made it cannot remove it in use
    const reentryWarnings = [];
    markSession(deps, path, input.session_id, reentryWarnings);
    return { exitCode: 0, stdout: path, stderr: reentryWarnings.join("\n") };
  }

  const warnings = [];
  const mode = configuredBaseRef(projectDir, env, deps);
  const base = baseRef(deps, layout.repoDir, mode, warnings);
  const add = git(deps, layout.repoDir, ["worktree", "add", "-q", "--detach", path, base]);
  if (add.status !== 0) {
    return {
      exitCode: 1,
      stderr: [...warnings, `git worktree add failed: ${add.stderr.trim()}`].join("\n"),
    };
  }
  markSession(deps, path, input.session_id, warnings);
  copyIncluded(deps, layout.repoDir, path, warnings);
  installDependencies(deps, layout.repoDir, input.name, path, warnings);
  return { exitCode: 0, stdout: path, stderr: warnings.join("\n") };
}

/** The worktree's own git dir (repo/.git/worktrees/<name>), where the session marker lives. */
function worktreeGitDir(deps, path) {
  const gitDir = git(deps, path, ["rev-parse", "--absolute-git-dir"]);
  return gitDir.status === 0 ? gitDir.stdout.trim() : null;
}

/** Record which session made the worktree, for session-end cleanup. */
function markSession(deps, path, sessionId, warnings) {
  if (!sessionId) return;
  const gitDir = worktreeGitDir(deps, path);
  try {
    if (!gitDir) throw new Error("no git dir");
    deps.writeText(join(gitDir, SESSION_MARKER), sessionId);
  } catch {
    warnings.push(`could not record the session for ${path}; session end will not remove it`);
  }
}

/**
 * Copy files listed in the repo's `.worktreeinclude` (gitignore syntax) that are also gitignored,
 * e.g. `.env`. Claude Code does this itself only when no WorktreeCreate hook is set.
 */
function copyIncluded(deps, repoDir, path, warnings) {
  if (!deps.exists(join(repoDir, ".worktreeinclude"))) return;
  const listArgs = ["ls-files", "--others", "--ignored", "--exclude-from=.worktreeinclude"];
  const candidates = git(deps, repoDir, listArgs).stdout.split("\n").filter(Boolean);
  if (candidates.length === 0) return;
  // check-ignore prints the candidates the repo's own ignore rules cover (exit 1 when none)
  const ignored = git(deps, repoDir, ["check-ignore", "--", ...candidates]);
  for (const file of ignored.stdout.split("\n").filter(Boolean)) {
    try {
      deps.copyFile(join(repoDir, file), join(path, file));
    } catch {
      warnings.push(`.worktreeinclude: could not copy ${file}`);
    }
  }
}

/**
 * Why removing the worktree at `path` would lose work, or null when it is safe. A failed check
 * counts as work: never remove what could not be inspected.
 * @param {Deps} deps
 * @param {string} path
 */
export function workProblem(deps, path) {
  const status = git(deps, path, ["status", "--porcelain"]);
  const unsaved = git(deps, path, ["rev-list", "HEAD", "--not", "--branches", "--remotes"]);
  // Exit 1 means detached, as this hook made it; 0 means someone checked out a branch
  const onBranch = git(deps, path, ["symbolic-ref", "-q", "HEAD"]);
  if (status.status !== 0 || unsaved.status !== 0 || onBranch.status > 1) {
    return "its state could not be read";
  }
  if (status.stdout.trim()) return "it has uncommitted or untracked changes";
  if (unsaved.stdout.trim()) return "it has commits no branch or remote holds";
  if (onBranch.status === 0) {
    return `branch ${onBranch.stdout.trim().replace("refs/heads/", "")} is checked out in it`;
  }
  return null;
}

/** WorktreeRemove: non-zero exit keeps the worktree. Claude Code relies on this check. */
export function remove(input, env, deps) {
  const { layout, error } = layoutFor(input, env, deps);
  if (!layout) return { exitCode: 1, stderr: error };
  const path = input.worktree_path;
  if (!path) return { exitCode: 1, stderr: "worktree_path is missing" };
  const problem = workProblem(deps, path);
  if (problem) return { exitCode: 1, stderr: `Kept ${path}: ${problem}` };
  const removal = git(deps, layout.repoDir, ["worktree", "remove", path]);
  if (removal.status === 0) return { exitCode: 0 };
  return { exitCode: 1, stderr: `Kept ${path}: ${removal.stderr.trim()}` };
}

/**
 * SubagentStop: Claude Code keeps hook-made subagent worktrees, so remove an unchanged one here.
 * The `agent-<agent_id>` folder name is observed behaviour (Claude Code 2.1.322), not documented;
 * if it changes, nothing matches and leftovers surface in /project-init instead.
 * Always exits 0: a non-zero exit would stop the subagent from finishing.
 */
export function subagentStop(input, env, deps) {
  if (!input.agent_id) return { exitCode: 0 };
  const { layout } = layoutFor(input, env, deps);
  if (!layout) return { exitCode: 0 };
  const path = join(layout.worktreesDir, `agent-${input.agent_id}`);
  if (!deps.exists(path)) return { exitCode: 0 };
  const problem = workProblem(deps, path);
  if (problem) return { exitCode: 0, stderr: `Kept ${path}: ${problem}` };
  const removal = git(deps, layout.repoDir, ["worktree", "remove", path]);
  if (removal.status === 0) return { exitCode: 0 };
  return { exitCode: 0, stderr: `Could not remove ${path}: ${removal.stderr.trim()}` };
}

/**
 * Linked worktree paths from `git worktree list --porcelain` (the first entry, the main checkout,
 * is skipped). git prints symlink-resolved paths, so ownership comes from the session marker,
 * not from comparing against `worktreesDir`.
 */
function listWorktrees(deps, layout) {
  const listing = git(deps, layout.repoDir, ["worktree", "list", "--porcelain"]);
  return listing.stdout
    .split("\n")
    .filter((line) => line.startsWith("worktree "))
    .map((line) => line.slice("worktree ".length))
    .slice(1);
}

/** Remove one worktree at session end when this session made it and it holds no work. */
function removeIfSessionsOwn(deps, layout, path, sessionId) {
  const gitDir = worktreeGitDir(deps, path);
  const owner = gitDir ? deps.readText(join(gitDir, SESSION_MARKER)) : null;
  if (owner?.trim() !== sessionId) return null;
  const problem = workProblem(deps, path);
  if (problem) return `Kept ${path}: ${problem}`;
  const removal = git(deps, layout.repoDir, ["worktree", "remove", path]);
  return removal.status === 0 ? null : `Could not remove ${path}: ${removal.stderr.trim()}`;
}

/**
 * SessionEnd: remove the worktrees this session made that hold no work, including those of
 * workflow agents, whose folder names SubagentStop cannot predict. Skipped on /clear and
 * /resume (the process, and possibly its cwd, lives on) and for the folder the session is in.
 * Always exits 0.
 */
export function sessionEnd(input, env, deps) {
  if (!input.session_id || ["clear", "resume"].includes(input.reason)) return { exitCode: 0 };
  const { layout } = layoutFor(input, env, deps);
  if (!layout) return { exitCode: 0 };
  const cwd = deps.realPath(String(input.cwd ?? ""));
  const notes = listWorktrees(deps, layout)
    .filter((path) => cwd !== path && !cwd.startsWith(path + sep))
    .map((path) => removeIfSessionsOwn(deps, layout, path, input.session_id))
    .filter(Boolean);
  return notes.length ? { exitCode: 0, stderr: notes.join("\n") } : { exitCode: 0 };
}

const handlers = { create, remove, "subagent-stop": subagentStop, "session-end": sessionEnd };

/**
 * Dispatch one hook event.
 * @param {string | undefined} event
 * @param {string} stdinText
 * @param {Record<string, string | undefined>} env
 * @param {Deps} deps
 * @returns {{ exitCode: number, stdout?: string, stderr?: string }}
 */
export function main(event, stdinText, env, deps = systemDeps) {
  const handler = event ? handlers[event] : undefined;
  if (!handler)
    return {
      exitCode: 1,
      stderr: `Unknown event "${event}": use create, remove, subagent-stop or session-end`,
    };
  let input;
  try {
    input = JSON.parse(stdinText);
  } catch {
    return { exitCode: 1, stderr: "Hook input is not JSON" };
  }
  return handler(input ?? {}, env, deps);
}

// Run only when executed directly, not when imported by the tests (argv[1] resolved, as in validate.mjs)
if (import.meta.url === pathToFileURL(realpathSync(String(process.argv[1]))).href) {
  const result = main(process.argv[2], readFileSync(0, "utf8"), process.env);
  if (result.stdout) process.stdout.write(`${result.stdout}\n`);
  if (result.stderr) process.stderr.write(`${result.stderr}\n`);
  process.exitCode = result.exitCode;
}
