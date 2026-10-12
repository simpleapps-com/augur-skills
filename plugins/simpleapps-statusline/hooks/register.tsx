// Two status lines under the prompt: where you are (GitHub user, project, branch, open issues and
// PRs, Anthropic account, version), then this session's cost and context and every plan rate limit
// Claude Code reports (5-hour, weekly) for the signed-in account.
// Source: $.session.usage(), refreshed on session.measure (after each turn, and when a limit moves).
import { atom, read, update } from "claude-code";
import type { EngineInterface, Register } from "claude-code";

import type { Limit, Reading, UsageSnapshot } from "../types";

const COMMAND = "plan-usage";

const snapshot = atom(
  { plugin: "simpleapps-statusline", key: "snapshot" } as const,
  {} as UsageSnapshot,
);

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** The session's cost in dollars, whether reported as a number or inside an object. */
export function costUsd(cost: unknown): number | undefined {
  if (num(cost) !== undefined) return num(cost);
  if (cost === null || typeof cost !== "object") return undefined;
  const c = cost as Record<string, unknown>;
  return num(c.totalUsd) ?? num(c.usd) ?? num(c.total_cost_usd) ?? num(c.totalCostUsd);
}

/** `$.session.usage()` reduced to what the pane shows; unknown shapes become undefined, never a throw. */
export function toReading(raw: unknown, at: number): Reading {
  const u = (raw ?? {}) as Record<string, unknown>;
  const context = (u.context ?? {}) as Record<string, unknown>;
  const limits = Array.isArray(u.rateLimits) ? (u.rateLimits as Record<string, unknown>[]) : [];
  return {
    at,
    cost: costUsd(u.cost),
    contextPercent: num(context.percent),
    limits: limits.map((l): Limit => ({
      kind: String(l.kind ?? "limit"),
      percent: num(l.percentUsed),
      resetsAt: l.resetsAt === undefined || l.resetsAt === null ? undefined : String(l.resetsAt),
    })),
  };
}

const NAMES: Record<string, string> = {
  five_hour: "5-hour",
  fiveHour: "5-hour",
  session: "5-hour",
  seven_day: "Weekly",
  sevenDay: "Weekly",
  weekly: "Weekly",
  monthly: "Monthly",
  spend_limit: "Spend limit",
};

/** A limit's label: known kinds by name, others (per-model, extra usage) from their own kind. */
export function limitName(kind: string): string {
  if (NAMES[kind]) return NAMES[kind];
  const words = kind.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** When a limit resets: the time today, else the weekday, else the date. */
export function resetLabel(resetsAt: string | undefined, now: number): string {
  if (resetsAt === undefined) return "";
  const asNumber = Number(resetsAt);
  // Seconds or milliseconds since the epoch, or an ISO date
  const ms = Number.isNaN(asNumber)
    ? Date.parse(resetsAt)
    : asNumber < 1e12
      ? asNumber * 1000
      : asNumber;
  if (Number.isNaN(ms)) return "";
  const d = new Date(ms);
  const days = (ms - now) / 86_400_000;
  if (days < 1 && d.getDate() === new Date(now).getDate())
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (days < 7) return d.toLocaleDateString("en-US", { weekday: "short" });
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** Red at 90% and over, yellow at 75%. */
export function percentColor(percent: number | undefined) {
  if (percent === undefined) return undefined;
  if (percent >= 90) return "red";
  return percent >= 75 ? "yellow" : undefined;
}

const pct = (p: number | undefined) => (p === undefined ? "?" : `${Math.round(p)}%`);

type Row = [string, string | undefined];

/** The bar's parts (and `/plan-usage`'s lines) as [text, color]. */
export function rows(r: Reading | undefined, now: number): Row[] {
  if (r === undefined) return [["No reading yet", undefined]];
  const cost = r.cost === undefined ? "" : `$${r.cost.toFixed(2)} · `;
  const session: Row = [`Session ${cost}ctx ${pct(r.contextPercent)}`, undefined];
  const limits = r.limits.map((l): Row => {
    const reset = resetLabel(l.resetsAt, now);
    const text = `${limitName(l.kind)} ${pct(l.percent)}${reset ? ` resets ${reset}` : ""}`;
    return [text, percentColor(l.percent)];
  });
  const none: Row = ["No plan limits reported", undefined];
  return [session, ...(limits.length ? limits : [none])];
}

const SHORT: Record<string, string> = { five_hour: "5h", seven_day: "week" };

/** One labelled figure in the bar; `percent` draws a meter. */
export type Part = { label: string; value: string; percent?: number; note?: string };

/** The bar's figures: session cost, context, then each limit with its reset. */
export function parts(r: Reading, now: number): Part[] {
  const cost: Part[] =
    r.cost === undefined ? [] : [{ label: "session", value: `$${r.cost.toFixed(2)}` }];
  const context: Part = { label: "ctx", value: pct(r.contextPercent), percent: r.contextPercent };
  const limits = r.limits.map((l): Part => {
    const reset = resetLabel(l.resetsAt, now);
    const label = SHORT[l.kind] ?? limitName(l.kind).toLowerCase();
    return {
      label,
      value: pct(l.percent),
      percent: l.percent,
      note: reset ? `↻ ${reset}` : undefined,
    };
  });
  return [...cost, context, ...limits];
}

/** A model id as people say it: `claude-opus-5-5[1m]` → `Opus 5.5 (1M)`. */
function prettyModel(id: string): string {
  const [, base = id, window] = /^(.*?)(?:\[(\w+)\])?$/.exec(id) ?? [];
  const words = base.replace(/^claude-/, "").split("-");
  const name = words
    .filter((w) => !/^\d+$/.test(w))
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  const version = words.filter((w) => /^\d+$/.test(w)).join(".");
  const label = [...name, version].filter(Boolean).join(" ");
  return window ? `${label} (${window.toUpperCase()})` : label;
}

/** `$.session.model()` as a short name, whether a string or an object. */
export function modelLabel(raw: unknown): string | undefined {
  if (typeof raw === "string") return raw ? prettyModel(raw) : undefined;
  if (raw === null || typeof raw !== "object") return undefined;
  const m = raw as Record<string, unknown>;
  const display = m.displayName ?? m.display_name;
  if (typeof display === "string" && display) return display;
  const id = m.id ?? m.model ?? m.name;
  return typeof id === "string" && id ? prettyModel(id) : undefined;
}

/** `$.session.version()` as `v2.1.296`, whether a string or an object. */
export function versionLabel(raw: unknown): string | undefined {
  const v =
    raw !== null && typeof raw === "object" ? (raw as Record<string, unknown>).version : raw;
  if (typeof v !== "string" || !v) return undefined;
  return v.startsWith("v") ? v : `v${v}`;
}

const WIDTH = 10;

/** A meter's filled and empty cell counts; 0–100%, a sliver shows for any use. */
export function meter(percent: number): [number, number] {
  const filled =
    percent <= 0 ? 0 : Math.max(1, Math.min(WIDTH, Math.round((percent / 100) * WIDTH)));
  return [filled, WIDTH - filled];
}

/** Meter colour: green, yellow at 75%, red at 90%. */
export const meterColor = (percent: number) => percentColor(percent) ?? "green";

/** `/plan-usage`: the lines, then the raw reading, so new kinds show up as they are. */
export function checkText(r: Reading, raw: unknown, now: number): string {
  const lines = [whereLabel(r), r.model, ...rows(r, now).map(([t]) => t)].filter(Boolean);
  return [...lines, `raw: ${JSON.stringify(raw)}`].join("\n");
}

/** The first line of a command's output; undefined when it failed or printed nothing. */
export function firstLine(out: unknown): string | undefined {
  const o = out as { exitCode?: number; stdout?: string } | undefined;
  if (o === undefined || o.exitCode !== 0) return undefined;
  return o.stdout?.split("\n")[0]?.trim() || undefined;
}

/** `$.session.root()` as a path, whether a string or an object. */
export function rootPath(raw: unknown): string | undefined {
  const p = raw !== null && typeof raw === "object" ? (raw as Record<string, unknown>).path : raw;
  return typeof p === "string" && p ? p.replace(/\/+$/, "") : undefined;
}

/** `claude auth status --json` as `email (plan)`; undefined when signed out or unreadable. */
export function accountLabel(out: unknown): string | undefined {
  const o = out as { exitCode?: number; stdout?: string } | undefined;
  if (o === undefined || o.exitCode !== 0) return undefined;
  try {
    const s = JSON.parse(o.stdout ?? "") as Record<string, unknown>;
    if (s.loggedIn !== true) return "signed out";
    const who = typeof s.email === "string" && s.email ? s.email : String(s.authMethod ?? "");
    return typeof s.subscriptionType === "string" && s.subscriptionType
      ? `${who} (${s.subscriptionType})`
      : who || undefined;
  } catch {
    return undefined;
  }
}

/** A GitHub remote URL (ssh or https) as `owner/name`; undefined for any other host. */
export function ghRepo(url: string | undefined): string | undefined {
  const m = /github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?\/?$/.exec(url ?? "");
  return m ? `${m[1]}/${m[2]}` : undefined;
}

/** The open issue and PR counts from the GraphQL answer; undefined when it failed. */
export function countsOf(out: unknown): { issues: number; prs: number } | undefined {
  const o = out as { exitCode?: number; stdout?: string } | undefined;
  if (o === undefined || o.exitCode !== 0) return undefined;
  try {
    const repo = (JSON.parse(o.stdout ?? "") as { data?: { repository?: Record<string, unknown> } })
      .data?.repository;
    const issues = num((repo?.issues as Record<string, unknown> | undefined)?.totalCount);
    const prs = num((repo?.pullRequests as Record<string, unknown> | undefined)?.totalCount);
    return issues === undefined || prs === undefined ? undefined : { issues, prs };
  } catch {
    return undefined;
  }
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** `7 issues · 2 PRs`; undefined when the counts are unknown. */
export function countsLabel(r: Reading): string | undefined {
  if (r.issues === undefined || r.prs === undefined) return undefined;
  return `${plural(r.issues, "issue")} · ${plural(r.prs, "PR")}`;
}

/** `user:project (branch) · N issues · N PRs · account · version`, the first line. */
export function whereLabel(r: Reading): string {
  const where = `${r.user ?? "?"}:${r.project ?? "?"}${r.branch ? ` (${r.branch})` : ""}`;
  return [where, countsLabel(r), r.account, r.version].filter(Boolean).join(" · ");
}

// GitHub login is cached this long, as the old status line did
const USER_TTL_MS = 2 * 60 * 60 * 1000;
const ACCOUNT_TTL_MS = 10 * 60 * 1000;
const COUNTS_TTL_MS = 5 * 60 * 1000;
// A repo's cached counts are dropped once unused this long
const COUNTS_KEEP_MS = 24 * 60 * 60 * 1000;
// Network calls (gh, claude) give up after this, so a dead network cannot hold up session start
// for $.process.run's 30 s default
const NETWORK = { timeoutMs: 5000 } as const;

const COUNTS_QUERY =
  "query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { issues(states: OPEN) { totalCount } pullRequests(states: OPEN) { totalCount } } }";

/** The GitHub login, cached for two hours; the old login when gh fails. */
async function ghLogin($: EngineInterface, now: number): Promise<string | undefined> {
  const cached = (await $.store.get("ghUser").catch(() => undefined)) as
    { login: string; at: number } | undefined;
  if (cached && now - cached.at < USER_TTL_MS) return cached.login;
  const login = firstLine(
    await $.process.run(["gh", "api", "user", "--jq", ".login"], NETWORK).catch(() => undefined),
  );
  if (!login) return cached?.login;
  await $.store.set("ghUser", { login, at: now }).catch(() => undefined);
  return login;
}

/** The Anthropic account Claude Code is signed in as; re-read soon so a /login shows. */
async function claudeAccount($: EngineInterface, now: number): Promise<string | undefined> {
  const cached = (await $.store.get("claudeAccount").catch(() => undefined)) as
    { label: string; at: number } | undefined;
  if (cached && now - cached.at < ACCOUNT_TTL_MS) return cached.label;
  const label = accountLabel(
    await $.process.run(["claude", "auth", "status", "--json"], NETWORK).catch(() => undefined),
  );
  if (!label) return cached?.label;
  await $.store.set("claudeAccount", { label, at: now }).catch(() => undefined);
  return label;
}

type Counts = { repo: string; issues: number; prs: number; at: number };

// One store key per repo: $.store is shared by every session, so sessions in different repos
// must not overwrite each other's counts
const COUNTS_PREFIX = "ghCounts:";

/** Drop counts for repos unused for a day, and the old single `ghCounts` key. */
async function pruneCounts($: EngineInterface, now: number) {
  const keys = (await $.store.keys().catch(() => [])) as string[];
  for (const key of keys) {
    if (key !== "ghCounts" && !key.startsWith(COUNTS_PREFIX)) continue;
    const entry = (await $.store.get(key).catch(() => undefined)) as Counts | undefined;
    if (key === "ghCounts" || !entry || now - entry.at > COUNTS_KEEP_MS)
      await $.store.delete(key).catch(() => undefined);
  }
}

/** Open issues and PRs in the folder's GitHub repo, cached five minutes per repo; none off GitHub. */
async function repoCounts($: EngineInterface, gitDir: string | undefined, now: number) {
  if (gitDir === undefined) return undefined;
  const repo = ghRepo(
    firstLine(
      await $.process
        .run(["git", "-C", gitDir, "remote", "get-url", "origin"])
        .catch(() => undefined),
    ),
  );
  if (repo === undefined) return undefined;
  const key = `${COUNTS_PREFIX}${repo}`;
  const same = (await $.store.get(key).catch(() => undefined)) as Counts | undefined;
  if (same && now - same.at < COUNTS_TTL_MS) return same;
  const [owner, name] = repo.split("/");
  const counts = countsOf(
    await $.process
      .run(
        [
          "gh",
          "api",
          "graphql",
          "-f",
          `query=${COUNTS_QUERY}`,
          "-f",
          `owner=${owner}`,
          "-f",
          `name=${name}`,
        ],
        NETWORK,
      )
      .catch(() => undefined),
  );
  if (counts === undefined) return same;
  const fresh: Counts = { repo, ...counts, at: now };
  await $.store.set(key, fresh).catch(() => undefined);
  await pruneCounts($, now);
  return fresh;
}

/** Everything the lines show, read fresh, plus the raw values for `/plan-usage`. */
async function measure($: EngineInterface) {
  const now = await $.clock.now();
  const [usage, model, version, rootRaw] = await Promise.all([
    $.session.usage().catch(() => undefined),
    Promise.resolve($.session.model()).catch(() => undefined),
    Promise.resolve($.session.version()).catch(() => undefined),
    Promise.resolve($.session.root()).catch(() => undefined),
  ]);
  const root = rootPath(rootRaw);
  // The project layout keeps the git repo in repo/; fall back to the folder itself
  const nested = root ? await $.fs.exists(`${root}/repo/.git`).catch(() => false) : false;
  const gitDir = nested ? `${root}/repo` : root;
  const branch = gitDir
    ? firstLine(
        await $.process
          .run(["git", "-C", gitDir, "branch", "--show-current"])
          .catch(() => undefined),
      )
    : undefined;
  const [user, account, counts] = await Promise.all([
    ghLogin($, now),
    claudeAccount($, now),
    repoCounts($, gitDir, now),
  ]);
  const reading: Reading = {
    issues: counts?.issues,
    prs: counts?.prs,
    account,
    ...toReading(usage, now),
    model: modelLabel(model),
    version: versionLabel(version),
    user,
    project: root?.split("/").pop(),
    branch,
  };
  await update($, snapshot, () => ({ reading }));
  return { reading, raw: { usage, model, version, root: rootRaw }, now };
}

export const register: Register = (on) => {
  on("session.start", async ($, e, next) => {
    await $.command.register({
      name: COMMAND,
      description: "Print this session's usage and the plan limits, with the raw reading.",
    });
    await measure($);
    return next(e);
  });

  // After each turn: the model (/model) or the branch may have changed
  on("session.measure", async ($, e, next) => {
    await measure($);
    return next(e);
  });

  on("command.run", { command: COMMAND }, async ($) => {
    const { reading, raw, now } = await measure($);
    return { text: checkText(reading, raw, now) };
  }).catch(async (_$, _e, next) => ({
    text: `plan-usage failed: ${next.error?.message ?? "unknown"}`,
  }));

  // Two lines under the prompt, below Claude Code's own hint line. Each part is a whole unit
  // that wraps to the next line when the terminal is too narrow, never split mid-word: two
  // lines when wide, three or four when narrow.
  on("ui.render", { component: "PromptHint" }, async ($, e, next) => {
    const s = await read($, snapshot);
    if (s.reading === undefined) return next(e);
    const { Box, Text } = $.ui.resolve(e);
    const theirs = await next(e);
    const now = await $.clock.now();
    const counts = countsLabel(s.reading);
    return (
      <Box flexDirection="column">
        {theirs}
        <Box flexDirection="row" flexWrap="wrap" columnGap={3}>
          {/* The location may shrink and wrap inside itself only when it alone is too wide */}
          <Text>
            <Text color="green">{s.reading.user ?? "?"}</Text>
            <Text dimColor>:</Text>
            <Text color="blue">{s.reading.project ?? "?"}</Text>
            {s.reading.branch && <Text dimColor>{` (${s.reading.branch})`}</Text>}
          </Text>
          {counts && (
            <Box flexShrink={0}>
              <Text bold>{counts}</Text>
            </Box>
          )}
          {s.reading.account && (
            <Box flexShrink={0}>
              <Text color="magenta">{s.reading.account}</Text>
            </Box>
          )}
          {s.reading.version && (
            <Box flexShrink={0}>
              <Text color="cyan">{s.reading.version}</Text>
            </Box>
          )}
        </Box>
        <Box flexDirection="row" flexWrap="wrap" columnGap={3}>
          {s.reading.model && (
            <Box flexShrink={0}>
              <Text color="yellow">{s.reading.model}</Text>
            </Box>
          )}
          {parts(s.reading, now).map((p) => {
            const [filled, empty] = p.percent === undefined ? [0, 0] : meter(p.percent);
            const color = p.percent === undefined ? undefined : meterColor(p.percent);
            return (
              <Box flexDirection="row" flexShrink={0} columnGap={1}>
                <Text dimColor>{p.label}</Text>
                {p.percent !== undefined && (
                  <Text>
                    <Text color={color}>{"━".repeat(filled)}</Text>
                    <Text dimColor>{"━".repeat(empty)}</Text>
                  </Text>
                )}
                <Text bold color={color}>
                  {p.value}
                </Text>
                {p.note && <Text dimColor>{p.note}</Text>}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  });
};
