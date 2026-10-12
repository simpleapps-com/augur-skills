import type {
  CommandRunInput,
  On,
  ProcessRunResult,
  SessionMeasureInput,
  SessionUsage,
} from "claude-code";
import { expect, mock, test } from "claude-code/testing";

import {
  checkText,
  accountLabel,
  costUsd,
  firstLine,
  rootPath,
  whereLabel,
  limitName,
  meter,
  meterColor,
  modelLabel,
  versionLabel,
  ghRepo,
  countsOf,
  countsLabel,
  parts,
  percentColor,
  resetLabel,
  rows,
  toReading,
} from "../hooks/register";

const HINT = {
  plugin: "simpleapps-statusline",
  component: "PromptHint",
  viewport: { columns: 160, rows: 40 },
  props: { isDraft: false, isWorking: false, hint: "" },
} as const;

const NOW = Date.parse("2026-10-09T14:00:00Z");

const START = { surface: "terminal", isInteractive: true, cwd: "/work" } as const;

/** `/plan-usage` as the person types it in the terminal. */
const planUsage = (args = ""): CommandRunInput => ({
  command: "plan-usage",
  args,
  origin: { kind: "composer" },
  presentation: { isFullscreen: false, columns: 160 },
});
const PLAN_USAGE = planUsage();

/** A finished child process, as `$.process.run` answers. */
const ran = (exitCode: number, stdout: string): { value: ProcessRunResult } => ({
  value: { exitCode, stdout, stderr: "", isStdoutTruncated: false, isStderrTruncated: false },
});

const USAGE = {
  startedAt: NOW - 60_000,
  context: { tokens: 380_000, window: 1_000_000, percent: 38 },
  rateLimits: [
    { kind: "five_hour", percentUsed: 62, resetsAt: new Date(NOW + 60 * 60 * 1000).toISOString() },
    { kind: "seven_day", percentUsed: 91, resetsAt: NOW + 3 * 86_400_000 },
  ],
  cost: { usd: 4.123 },
};

test("toReading keeps what the pane shows and survives unknown shapes", async () => {
  const r = toReading(USAGE, NOW);
  expect(r.cost).toBe(4.123);
  expect(r.contextPercent).toBe(38);
  expect(r.limits.map((l) => [l.kind, l.percent])).toEqual([
    ["five_hour", 62],
    ["seven_day", 91],
  ]);
  expect(toReading(undefined, NOW)).toEqual({
    at: NOW,
    cost: undefined,
    contextPercent: undefined,
    limits: [],
  });
  expect(toReading({ rateLimits: [{}] }, NOW).limits).toEqual([
    { kind: "limit", percent: undefined, resetsAt: undefined },
  ]);
});

test("costUsd reads a number or the known object fields", async () => {
  expect(costUsd(1.5)).toBe(1.5);
  expect(costUsd({ usd: 2 })).toBe(2);
  expect(costUsd({ totalUsd: 3 })).toBe(3);
  expect(costUsd({ total_cost_usd: 4 })).toBe(4);
  expect(costUsd({ other: 5 })).toBeUndefined();
  expect(costUsd(null)).toBeUndefined();
  expect(costUsd("x")).toBeUndefined();
});

test("limit names, reset times and colours", async () => {
  expect(limitName("five_hour")).toBe("5-hour");
  expect(limitName("seven_day")).toBe("Weekly");
  expect(limitName("spend_limit")).toBe("Spend limit");
  expect(limitName("weekly_scoped")).toBe("Weekly scoped");
  expect(limitName("sevenDayFable")).toBe("Seven Day Fable");
  expect(resetLabel(undefined, NOW)).toBe("");
  expect(resetLabel("nonsense", NOW)).toBe("");
  // Local time, so only the shape is fixed
  expect(resetLabel(new Date(NOW + 30 * 60 * 1000).toISOString(), NOW)).toMatch(/^\d\d:\d\d$/);
  expect(resetLabel(String(Math.floor((NOW + 3 * 86_400_000) / 1000)), NOW)).toMatch(
    /^[A-Z][a-z]{2}$/,
  );
  expect(resetLabel(String(NOW + 30 * 86_400_000), NOW)).toMatch(/^\d+\/\d+$/);
  expect([percentColor(undefined), percentColor(50), percentColor(75), percentColor(90)]).toEqual([
    undefined,
    undefined,
    "yellow",
    "red",
  ]);
});

test("rows and the check text", async () => {
  expect(rows(undefined, NOW)).toEqual([["No reading yet", undefined]]);
  const r = toReading(USAGE, NOW);
  const lines = rows(r, NOW);
  expect(lines[0]).toEqual(["Session $4.12 · ctx 38%", undefined]);
  expect(lines[1]?.[0]).toMatch(/^5-hour 62% resets \d\d:\d\d$/);
  expect(lines[2]?.[1]).toBe("red");
  expect(rows(toReading({}, NOW), NOW)).toEqual([
    ["Session ctx ?", undefined],
    ["No plan limits reported", undefined],
  ]);
  expect(checkText(r, USAGE, NOW)).toContain(`raw: ${JSON.stringify(USAGE)}`);
});

test("model and version labels", async () => {
  // Shapes seen live: an id string, and { version, base, builtAt }
  expect(modelLabel("claude-opus-5-5")).toBe("Opus 5.5");
  expect(modelLabel("claude-fable-5-1")).toBe("Fable 5.1");
  expect(modelLabel("claude-opus-5-5[1m]")).toBe("Opus 5.5 (1M)");
  expect(modelLabel({ displayName: "Sonnet 5.5" })).toBe("Sonnet 5.5");
  expect(modelLabel({ id: "claude-haiku-5-5" })).toBe("Haiku 5.5");
  expect([modelLabel(""), modelLabel({}), modelLabel(null), modelLabel(3)]).toEqual([
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  expect(versionLabel({ version: "2.1.296", base: "2.1.296" })).toBe("v2.1.296");
  expect(versionLabel("v2.1.0")).toBe("v2.1.0");
  expect(versionLabel({})).toBeUndefined();
});

test("the GitHub repo and its open issue and PR counts", async () => {
  expect(ghRepo("git@github.com:acme/site.git")).toBe("acme/site");
  expect(ghRepo("https://github.com/acme/site")).toBe("acme/site");
  expect(ghRepo("https://gitlab.com/acme/site.git")).toBeUndefined();
  expect(ghRepo(undefined)).toBeUndefined();
  const answer = (issues: unknown, prs: unknown) => ({
    exitCode: 0,
    stdout: JSON.stringify({
      data: { repository: { issues: { totalCount: issues }, pullRequests: { totalCount: prs } } },
    }),
  });
  expect(countsOf(answer(7, 1))).toEqual({ issues: 7, prs: 1 });
  expect(countsOf(answer(7, null))).toBeUndefined();
  expect(countsOf({ exitCode: 1, stdout: "" })).toBeUndefined();
  expect(countsOf({ exitCode: 0, stdout: "not json" })).toBeUndefined();
  const r = toReading(USAGE, NOW);
  expect(countsLabel({ ...r, issues: 7, prs: 1 })).toBe("7 issues · 1 PR");
  expect(countsLabel({ ...r, issues: 1, prs: 0 })).toBe("1 issue · 0 PRs");
  expect(countsLabel(r)).toBeUndefined();
});

test("command output, root path and the where label", async () => {
  expect(firstLine({ exitCode: 0, stdout: "main\nmore" })).toBe("main");
  expect(firstLine({ exitCode: 0, stdout: "" })).toBeUndefined();
  expect(firstLine({ exitCode: 128, stdout: "main" })).toBeUndefined();
  expect(firstLine(undefined)).toBeUndefined();
  expect(rootPath("/a/b/")).toBe("/a/b");
  expect(rootPath({ path: "/a/c" })).toBe("/a/c");
  expect([rootPath(""), rootPath(null), rootPath({})]).toEqual([undefined, undefined, undefined]);
  const r = toReading(USAGE, NOW);
  expect(whereLabel({ ...r, user: "u", project: "p", branch: "b" })).toBe("u:p (b)");
  expect(whereLabel(r)).toBe("?:?");
  expect(whereLabel({ ...r, user: "u", project: "p", account: "a (max)" })).toBe("u:p · a (max)");
  const out = (s: object, exitCode = 0) => ({ exitCode, stdout: JSON.stringify(s) });
  expect(accountLabel(out({ loggedIn: true, email: "e@x", subscriptionType: "pro" }))).toBe(
    "e@x (pro)",
  );
  expect(accountLabel(out({ loggedIn: true, authMethod: "apiKey" }))).toBe("apiKey");
  expect(accountLabel(out({ loggedIn: true }))).toBeUndefined();
  expect(accountLabel(out({ loggedIn: false }))).toBe("signed out");
  expect(accountLabel(out({}, 1))).toBeUndefined();
  expect(accountLabel({ exitCode: 0, stdout: "not json" })).toBeUndefined();
  expect(accountLabel(undefined)).toBeUndefined();
});

test("parts and meters", async () => {
  const p = parts(toReading(USAGE, NOW), NOW);
  expect(p.map((x) => [x.label, x.value, x.percent])).toEqual([
    ["session", "$4.12", undefined],
    ["ctx", "38%", 38],
    ["5h", "62%", 62],
    ["week", "91%", 91],
  ]);
  expect(p[2]?.note).toMatch(/^↻ \d\d:\d\d$/);
  expect(parts(toReading({ rateLimits: [{ kind: "spend_limit" }] }, NOW), NOW)).toEqual([
    { label: "ctx", value: "?", percent: undefined },
    { label: "spend limit", value: "?", percent: undefined, note: undefined },
  ]);
  expect([meter(0), meter(1), meter(42), meter(100), meter(150)]).toEqual([
    [0, 10],
    [1, 9],
    [4, 6],
    [10, 0],
    [10, 0],
  ]);
  expect([meterColor(10), meterColor(80), meterColor(95)]).toEqual(["green", "yellow", "red"]);
});

type World = {
  ghCalls: number;
  countCalls?: number;
  claudeCalls?: number;
  store: Map<string, unknown>;
  nested: boolean;
  ghFails?: boolean;
  countsFail?: boolean;
  // session.root's answer and the origin remote; defaults are a GitHub project folder
  root?: string;
  remote?: string;
  // Stub the clock by hand so a test can make it fail part-way through
  clock?: { fails: boolean };
  // timeoutMs each gh / claude call asked for
  networkTimeouts?: (number | undefined)[];
};

const COUNTS = {
  data: { repository: { issues: { totalCount: 7 }, pullRequests: { totalCount: 2 } } },
};

/** What `gh` and `claude` answer in the test world, counting each call. */
function networkAnswer(world: World, argv: readonly string[]) {
  if (argv[0] === "claude") {
    world.claudeCalls = (world.claudeCalls ?? 0) + 1;
    const status = { loggedIn: true, email: "me@example.com", subscriptionType: "max" };
    return ran(0, JSON.stringify(status));
  }
  if (argv[2] === "graphql") {
    world.countCalls = (world.countCalls ?? 0) + 1;
    return world.countsFail ? ran(1, "") : ran(0, JSON.stringify(COUNTS));
  }
  world.ghCalls++;
  return ran(world.ghFails ? 1 : 0, "octo\n");
}

/** What `git` answers: the origin remote, or the branch (from repo/ when the project keeps its repo there). */
function gitAnswer(world: World, argv: readonly string[]) {
  if (argv[3] === "remote")
    return ran(0, `${world.remote ?? "git@github.com:acme/acme-work.git"}\n`);
  return ran(0, String(argv[2]).endsWith("/repo") ? "feat/x\n" : "main\n");
}

function stubs(
  on: On,
  usage: () => unknown,
  world: World = { ghCalls: 0, store: new Map(), nested: true },
) {
  const clock = world.clock;
  if (clock) on("clock.now", () => (clock.fails ? { deny: "clock unavailable" } : { value: NOW }));
  else mock.clock(on, { now: NOW });
  on("session.root", () => ({ value: world.root ?? "/Users/me/Projects/acme-work" }));
  on("fs.exists", (_$, e) => ({ value: world.nested && e.path.endsWith("/repo/.git") }));
  on("store.get", (_$, e) => ({ value: world.store.get(e.key) }));
  on("store.set", (_$, e) => {
    world.store.set(e.key, e.value);
    return { value: undefined };
  });
  on("store.keys", () => ({ value: [...world.store.keys()] }));
  on("store.delete", (_$, e) => {
    world.store.delete(e.key);
    return { value: undefined };
  });
  on("process.run", (_$, e) => {
    const argv = e.argv;
    if (argv[0] === "gh" || argv[0] === "claude") {
      world.networkTimeouts?.push(e.init?.timeoutMs);
      return networkAnswer(world, argv);
    }
    return gitAnswer(world, argv);
  });
  on("session.start", () => ({ cwd: "/work" }));
  on("command.register", () => ({ value: { command: "plan-usage" } }));
  on("session.measure", () => ({ changed: [] }));
  // Claude Code's own hint line, which ours goes under
  on("ui.render", ($, e) => $.ui.resolve(e).Text({ children: ["the usual hint"] }));
  on("session.model", () => ({ value: "claude-opus-5-5" }));
  on("session.version", () => ({ value: { version: "2.1.296", base: "2.1.296" } }));
  on("session.usage", () => {
    const value = usage();
    // Readings are deliberately loose (numeric resetsAt, missing fields) to prove the mod copes
    return value instanceof Error ? { deny: value.message } : { value: value as SessionUsage };
  });
}

test("the line under the prompt shows meters, keeps the hint, and updates after a turn", async ($, on) => {
  let usage: unknown = { ...USAGE, rateLimits: [] };
  stubs(on, () => usage);
  await $.session.start({ surface: "terminal", isInteractive: true, cwd: "/work" });
  for (const surface of ["terminal", "desktop"] as const) {
    const ui = await $.ui.mount({ ...HINT, surface });
    expect(await ui.find({ type: "Text", text: "the usual hint" })).toBeDefined();
    expect(await ui.find({ type: "Text", text: "$4.12" })).toBeDefined();
    expect(await ui.find({ type: "Text", text: "5h" })).toBeUndefined();
    await ui.unmount();
  }

  usage = USAGE;
  const turn: SessionMeasureInput = {
    context: USAGE.context,
    rateLimits: [],
    changed: ["context", "rateLimits"],
  };
  await $.session.measure(turn);
  const again = await $.ui.mount({ ...HINT, surface: "terminal" });
  expect(await again.find({ type: "Text", text: "week" })).toBeDefined();
  expect(await again.find({ type: "Text", text: "91%" })).toBeDefined();
  expect(await again.find({ type: "Text", text: "━".repeat(9) })).toBeDefined();
  // Model starts the meters line; version ends the first line
  expect(await again.find({ type: "Text", text: "Opus 5.5" })).toBeDefined();
  expect(await again.find({ type: "Text", text: "v2.1.296" })).toBeDefined();
  expect(await again.find({ type: "Text", text: "7 issues · 2 PRs" })).toBeDefined();
  // The line above: GitHub user, project folder, branch
  expect(await again.find({ type: "Text", text: "octo" })).toBeDefined();
  expect(await again.find({ type: "Text", text: "acme-work" })).toBeDefined();
  expect(await again.find({ type: "Text", text: " (feat/x)" })).toBeDefined();
  expect(await again.find({ type: "Text", text: "me@example.com (max)" })).toBeDefined();
  await again.unmount();
});

test("/plan-usage answers with the lines and the raw reading", async ($, on) => {
  stubs(on, () => USAGE);
  await $.session.start({ surface: "terminal", isInteractive: true, cwd: "/work" });
  const answer = await $.command.run(PLAN_USAGE);
  expect(answer.text).toMatch(
    /^octo:acme-work \(feat\/x\) · 7 issues · 2 PRs · me@example\.com \(max\) · v2\.1\.296\nOpus 5\.5\nSession \$4\.12 · ctx 38%\n5-hour 62%/,
  );
  expect(answer.text).toContain('"kind":"seven_day"');
});

test("issue and PR counts are cached five minutes per repo", async ($, on) => {
  const world: World = { ghCalls: 0, countCalls: 0, store: new Map(), nested: true };
  stubs(on, () => USAGE, world);
  await $.session.start({ surface: "terminal", isInteractive: true, cwd: "/work" });
  expect(world.countCalls).toBe(1);
  await $.command.run(PLAN_USAGE);
  expect(world.countCalls).toBe(1);
  // Another session, in another repo, caches its own counts: ours stay cached
  world.store.set("ghCounts:acme/other", { repo: "acme/other", issues: 1, prs: 1, at: NOW });
  await $.command.run(PLAN_USAGE);
  expect(world.countCalls).toBe(1);
  // Five minutes on, ours are read again
  world.store.set("ghCounts:acme/acme-work", {
    repo: "acme/acme-work",
    issues: 7,
    prs: 2,
    at: NOW - 6 * 60_000,
  });
  await $.command.run(PLAN_USAGE);
  expect(world.countCalls).toBe(2);
});

test("a fresh count drops counts unused for a day and the old single key", async ($, on) => {
  const world: World = { ghCalls: 0, countCalls: 0, store: new Map(), nested: true };
  const day = 24 * 60 * 60_000;
  world.store.set("ghCounts", { repo: "acme/acme-work", issues: 1, prs: 1, at: NOW });
  world.store.set("ghCounts:acme/old", { repo: "acme/old", issues: 1, prs: 1, at: NOW - 2 * day });
  world.store.set("ghCounts:acme/recent", {
    repo: "acme/recent",
    issues: 1,
    prs: 1,
    at: NOW - 60_000,
  });
  world.store.set("ghCounts:acme/broken", undefined);
  world.store.set("ghUser", { login: "octo", at: NOW });
  stubs(on, () => USAGE, world);
  await $.session.start(START);
  expect([...world.store.keys()].sort()).toEqual([
    "claudeAccount",
    "ghCounts:acme/acme-work",
    "ghCounts:acme/recent",
    "ghUser",
  ]);
});

test("gh and claude calls give up after five seconds", async ($, on) => {
  const world: World = {
    ghCalls: 0,
    store: new Map(),
    nested: true,
    networkTimeouts: [],
  };
  stubs(on, () => USAGE, world);
  await $.session.start(START);
  // gh api user, claude auth status, gh api graphql
  expect(world.networkTimeouts).toEqual([5000, 5000, 5000]);
});

test("in a narrow terminal every part is still drawn whole", async ($, on) => {
  stubs(on, () => USAGE);
  await $.session.start(START);
  const ui = await $.ui.mount({
    ...HINT,
    viewport: { columns: 60, rows: 40 },
    surface: "terminal",
  });
  for (const text of [
    "octo",
    "7 issues · 2 PRs",
    "me@example.com (max)",
    "v2.1.296",
    "Opus 5.5",
    "5h",
    "week",
    "91%",
  ])
    expect(await ui.find({ type: "Text", text })).toBeDefined();
  await ui.unmount();
});

test("the GitHub user is cached for two hours; the branch comes from the folder without repo/", async ($, on) => {
  const world: World = { ghCalls: 0, store: new Map(), nested: false };
  stubs(on, () => USAGE, world);
  await $.session.start({ surface: "terminal", isInteractive: true, cwd: "/work" });
  await $.command.run(PLAN_USAGE);
  expect(world.ghCalls).toBe(1);
  // Cached less than two hours ago: no new call
  world.store.set("ghUser", { login: "cached", at: NOW - 60 * 60 * 1000 });
  const fresh = await $.command.run(PLAN_USAGE);
  expect(world.ghCalls).toBe(1);
  expect(fresh.text).toMatch(/^cached:acme-work \(main\) · /);
  // Stale, and gh fails: keep the old login
  world.store.set("ghUser", { login: "cached", at: NOW - 3 * 60 * 60 * 1000 });
  world.ghFails = true;
  const stale = await $.command.run(PLAN_USAGE);
  expect(world.ghCalls).toBe(2);
  expect(stale.text).toMatch(/^cached:/);
});

test("a failed usage read shows no numbers rather than failing", async ($, on) => {
  stubs(on, () => new Error("not signed in"));
  await $.session.start({ surface: "terminal", isInteractive: true, cwd: "/work" });
  const answer = await $.command.run(planUsage("check"));
  expect(answer.text).toMatch(
    /^octo:acme-work \(feat\/x\) · 7 issues · 2 PRs · me@example\.com \(max\) · v2\.1\.296\nOpus 5\.5\nSession ctx \?\nNo plan limits reported\nraw: /,
  );
});

test("the Anthropic account is cached ten minutes, then read again", async ($, on) => {
  const world: World = { ghCalls: 0, claudeCalls: 0, store: new Map(), nested: true };
  world.store.set("claudeAccount", { label: "cached@example.com (pro)", at: NOW - 5 * 60_000 });
  stubs(on, () => USAGE, world);
  await $.session.start(START);
  const fresh = await $.command.run(PLAN_USAGE);
  expect(world.claudeCalls).toBe(0);
  expect(fresh.text).toContain("cached@example.com (pro)");
  world.store.set("claudeAccount", { label: "cached@example.com (pro)", at: NOW - 11 * 60_000 });
  const stale = await $.command.run(PLAN_USAGE);
  expect(world.claudeCalls).toBe(1);
  expect(stale.text).toContain("me@example.com (max)");
});

test("with no git folder there is no branch and no counts", async ($, on) => {
  const noFolder: World = { ghCalls: 0, countCalls: 0, store: new Map(), nested: false, root: "" };
  stubs(on, () => USAGE, noFolder);
  await $.session.start(START);
  const answer = await $.command.run(PLAN_USAGE);
  expect(answer.text).toMatch(/^octo:\? · me@example\.com \(max\) · v2\.1\.296\n/);
  expect(noFolder.countCalls).toBe(0);
});

test("a non-GitHub remote hides the issue and PR counts", async ($, on) => {
  const world: World = {
    ghCalls: 0,
    countCalls: 0,
    store: new Map(),
    nested: true,
    remote: "https://gitlab.com/acme/site.git",
  };
  stubs(on, () => USAGE, world);
  await $.session.start(START);
  const answer = await $.command.run(PLAN_USAGE);
  expect(answer.text).toMatch(/^octo:acme-work \(feat\/x\) · me@example\.com \(max\) · /);
  expect(world.countCalls).toBe(0);
});

test("a failed count keeps the last counts for that repo, and shows none without them", async ($, on) => {
  const world: World = { ghCalls: 0, countCalls: 0, store: new Map(), nested: true };
  world.store.set("ghCounts:acme/acme-work", {
    repo: "acme/acme-work",
    issues: 3,
    prs: 1,
    at: NOW - 10 * 60_000,
  });
  world.countsFail = true;
  stubs(on, () => USAGE, world);
  await $.session.start(START);
  const kept = await $.command.run(PLAN_USAGE);
  expect(kept.text).toMatch(/^octo:acme-work \(feat\/x\) · 3 issues · 1 PR · /);
  world.store.delete("ghCounts:acme/acme-work");
  const none = await $.command.run(PLAN_USAGE);
  expect(none.text).toMatch(/^octo:acme-work \(feat\/x\) · me@example\.com \(max\) · /);
});

test("before the first reading, only Claude Code's own hint is drawn", async ($, on) => {
  stubs(on, () => USAGE);
  const ui = await $.ui.mount({ ...HINT, surface: "terminal" });
  expect(await ui.find({ type: "Text", text: "the usual hint" })).toBeDefined();
  expect(await ui.find({ type: "Text", text: "octo" })).toBeUndefined();
  await ui.unmount();
});

test("/plan-usage replies with the error when a reading fails", async ($, on) => {
  const clock = { fails: false };
  stubs(on, () => USAGE, { ghCalls: 0, store: new Map(), nested: true, clock });
  await $.session.start(START);
  clock.fails = true;
  const answer = await $.command.run(PLAN_USAGE);
  expect(answer.text).toMatch(/^plan-usage failed: /);
});
