# simpleapps-statusline

Two status lines just under the prompt, below Claude Code's own hint line:

```
octo:my-project (main)   7 issues · 2 PRs   me@example.com (max)   v2.1.296
Opus 5.5   session $1.24   ctx ━━━━━━━━━━ 31%   5h ━━━━━━━━━━ 21% ↻ 15:00   week ━━━━━━━━━━ 44% ↻ Tue
```

Each meter is ten cells: the used share in colour, the rest dimmed.

- **Line 1:** GitHub login (`gh api user`, cached 2 hours), project folder, git branch (from `repo/` when the project uses the `{project}/repo/` layout), open issues and PRs in that GitHub repo (cached 5 minutes per repo, hidden off GitHub), the Anthropic account and plan from `claude auth status` (cached 10 minutes), and the Claude Code version. `gh` and `claude` calls give up after 5 seconds, so a dead network cannot hold up session start.
- **Line 2:** the model, this session's cost, then meters for context used and each plan limit Claude Code reports (5-hour, weekly, others by name), with % used and when it resets. Green, yellow at 75%, red at 90%.

It refreshes after every turn. Each part moves to the next line as a whole when the terminal is narrow: two lines when wide, three or four at 80 to 120 columns. Plan limits show for plans that report them (Pro and Max), and context shows `?` until the session's first response. Per-model and monthly extra-usage figures are in no supported interface; `/usage` shows them (anthropics/claude-code#92080).

This plugin is a **mod**: TypeScript that runs inside Claude Code. It is separate from `simpleapps`, so it can be turned off on its own in `/plugin`.

## Install

Requires Claude Code 2.1.287 or later.

```
/plugin install simpleapps-statusline@augur-skills
/reload-plugins
```

Then delete `statusLine` from `~/.claude/settings.json`, so the replaced `statusline-full` / `statusline-basic` script does not draw a second status line.

In a folder you have not trusted yet, no mod loads until you answer the trust prompt.

## Check it

`/plan-usage` prints the same lines plus the raw reading, so it works without seeing the terminal:

```bash
claude -p "/plan-usage"
```

## Develop

From the root of this repo:

```bash
claude --plugin-dir plugins/simpleapps-statusline   # reloads on save; generates API types (gitignored)
claude plugin validate --strict plugins/simpleapps-statusline
claude plugin test plugins/simpleapps-statusline
pnpm exec tsc -p plugins/simpleapps-statusline/tsconfig.json --noEmit   # after --plugin-dir has generated the types
```

All three MUST pass before pushing; CI does not run them (the type check needs the API types only `--plugin-dir` generates). Tests stub every process, store, and session call, so they need no network. Loader rules: write each `$` call in full and pass `$` only to top-level functions; give a `command.run` hook `.catch(...)`; keep `$.state` in a `const` `atom` declared in `types/index.d.ts`. Full API: the [mods docs](https://code.claude.com/docs/en/plugins/mods/overview).
