---
name: curate-wiki
description: Continuously improve the project wiki. Better content, context, organization, and usability within the wiki's active token budget (default 20K, configurable per project).
allowed-tools: Bash(git -C:*), Bash(wc:*), Bash(rm:*), Skill(wiki), Skill(writing-style), Skill(work-habits), Skill(git-safety), Skill(bash-simplicity), Skill(context-efficiency), Read, Write, Glob, Grep, Edit, Agent
---

First, use Skill("wiki") to load wiki conventions, Skill("writing-style") for RFC 2119 directive language and token-efficient prose, Skill("work-habits") for RFC 2119 reading compliance, Skill("git-safety") to load git guardrails, Skill("bash-simplicity") for Bash conventions, and Skill("context-efficiency") for always-loaded content guidelines.

Curate the project wiki. Each run targets the highest-value gaps, not exhaustive improvement. The wiki MUST stay within its active token budget (default 20K, or the override from `.simpleapps/settings.json`) so it can be loaded into context without consuming the working window.

The working code is the ground truth. The current session is the hint where to start. Use what was learned, discussed, or changed this session to guide where the wiki most needs attention. Then verify against the actual codebase.

**Prioritization**: Fix inaccuracies and critical gaps first (missing Deployment page, outdated instructions, wrong claims). Then improve clarity and organization. Do not polish pages that are already accurate and clear. An accurate wiki with rough prose is better than a polished wiki that delays shipping. Propose improvements in priority order so the user can draw the line.

**MUST complete ALL steps below in sequence without stopping.** Do not pause between steps or wait for prompts. Run through the entire process, stopping only at step 5 (approve changes) and step 8 (approve commit/push).

## 1. Determine token budget

Read `.simpleapps/settings.json`. If it contains `wikiTokenBudget`, use that number as the active budget. Otherwise the default is 20000 tokens. If `wikiTokenBudgetReason` is present, note it: a previous session recorded why the exception was granted, and it stays visible in this run so the exception can be re-negotiated.

Run `wc -w wiki/*.md` and multiply by 1.3 for the current token estimate. Record:

- Starting usage
- Active budget (default 20000 or override)
- Budget reason (if overridden)

Compare usage against the active budget:

- **Under 90% of budget**: normal mode, curate freely.
- **90%–100% of budget**: pruning is a PRIORITY for this run, not an afterthought. Identify verbose or low-value pages as pruning candidates before step 3 begins. Do not add content unless equivalent trimming is identified alongside it.
- **Over 100% of budget**: recovery mode. STOP before adding any content. The whole run focuses on trimming back under budget, or on the budget-increase prompt at step 7 if the user has a reason.

## 2. Load the wiki

Use Glob to find all `wiki/*.md` files. Read every page using the Read tool. The full wiki MUST be in context.

## 3. Assess the wiki

Evaluate each page against the wiki conventions (from the wiki skill) and the current codebase. Look for improvement opportunities in six areas:

### Content quality
- Are statements accurate? Verify claims against the actual code using Grep, Glob, Read, or Agent with subagent_type=Explore.
- Is anything missing that the current session revealed?
- Are explanations clear for all three audiences?
- Does `Testing.md` exist? If not, suggest creating one. If it does, update it with any testing knowledge from this session: new edge cases, failure patterns, test data, or verification steps discovered during implementation or debugging.
- Does `Deployment.md` exist? If not, this is a **high-priority gap**. Flag it for step 3b.

### Context
- Does each page explain *why*, not just *what*?
- Are decisions documented with rationale?
- Can an AI agent reading this page act on it without ambiguity?
- Would someone on a different project find this useful? Tag platform patterns vs site-specific content (see wiki skill's Learning Organization section).

### Organization
- Is information in the right place? Would readers find it where they expect?
- Are there sections that belong on a different page?
- Is the sidebar navigation logical and complete?

### Cross-linking
Cross-linking turns a collection of files into a knowledge graph. Focus on high-value connections:
- Are concepts that are explained elsewhere linked with `[[Page-Name#section]]`?
- Are there isolated pages with no inbound or outbound links?

Do not exhaustively cross-link every mention of every concept. Link where a reader would naturally need to navigate, not to maximize link density.

### Usability
- Can a reader quickly find what they need?
- Are pages self-contained or do they require jumping between pages?

### Directive language (RFC 2119)
Every directive sentence MUST use MUST / MUST NOT / SHOULD / SHOULD NOT / MAY. Scan each page for soft language that dilutes directives: "always", "never", "be sure to", "make sure", "don't forget", "try to", "should probably", "needs to", "remember to". Rewrite each occurrence per the conversion table in the `writing-style` skill. Agents silently downgrade soft language. A wiki full of "should probably" will not be followed.

### Consolidation
- Is there duplicated or scattered information that should be merged?
- Are there overlapping pages that should be combined?

### Pruning
- Is there outdated content that no longer matches reality?
- Is there filler or verbose text that can be tightened?
- Can anything be removed to free token budget for higher-value content?

## 3b. Generate Deployment page (if missing)

**This step is MANDATORY if `wiki/Deployment.md` does not exist.** The `/submit`, `/deploy`, and `/publish` commands refuse to run without it. Generating this page is the highest-priority action in any curate-wiki run when it is missing.

1. **Scan** the codebase for deployment artifacts:
   - CI workflows (`.github/workflows/`, Jenkinsfile, etc.)
   - Package scripts (`package.json` scripts like `deploy`, `release`, `build`)
   - Deploy configs (Vercel, Netlify, Docker, Makefile, deploy scripts)
   - Version files (VERSION, package.json version, CalVer/SemVer patterns)
   - Tag-based release workflows
   - Branch protection or merge conventions
   - `pnpm-workspace.yaml`: if present, the Submit section MUST include a lockfile sync step: run `pnpm install` at the repo root after any package changes, and commit the updated `pnpm-lock.yaml` before pushing. CI uses `--frozen-lockfile` and will reject mismatched lockfiles. This is the most common cause of deploy failures.

2. **Draft** the Deployment page with three sections (Submit, Deploy, Publish) based on what was found. Use the format defined in the `deployment` skill. Not all projects need all three sections. Only include sections where the codebase reveals a clear process.

3. **Ask the user** about anything the codebase does not reveal:
   - "I see a GitHub Actions workflow triggered by tags, but how does staging deploy? Is it automatic on merge?"
   - "I found a Vercel config. Does merging to main auto-deploy to staging?"
   - "There is no version file. Does this project use versioned releases or just deploy on merge?"
   Do NOT skip this step. Do NOT guess. Ask and wait for answers.

4. **Incorporate answers** into the final Deployment page. The page MUST be grounded in both code and user knowledge, not guesses.

5. Add the page to `wiki/_Sidebar.md` and `wiki/Home.md`.

If `wiki/Deployment.md` already exists, verify each section still matches the codebase. Flag any drift.

## 4. Audit always-loaded content (report only)

Check `repo/.claude/CLAUDE.md` and `repo/.claude/rules/*.md` against the context-efficiency skill. These files load on every prompt. They MUST be lean, evergreen, and follow the pointer pattern.

Read each file and check:
- **Line count**: `wc -l repo/.claude/CLAUDE.md`. MUST be under 200 lines (official platform limit).
- **Evergreen violations**: hardcoded file counts, version numbers, timestamps, process data, or content that duplicates the code
- **Pointer pattern**: rules SHOULD be short triggers that invoke a skill for detail. Flag any rule that contains full behavioral guidance instead of invoking a skill.
- **Staleness**: claims that no longer match reality (verify against the codebase)
- **Duplication**: content that duplicates what's in the wiki or a skill

CLAUDE.md MUST only contain **pointers** (wiki links, one-line references). If informational content (explanations, instructions, conventions) exists in CLAUDE.md, move it to the appropriate wiki page and replace it with a link. Do not add substantive content to CLAUDE.md. Put it in the wiki and point to it. Keep CLAUDE.md edits minimal to avoid unnecessary permission prompts.

## 5. Propose changes

Present a prioritized list of improvements:

```
N. [ACTION] Page.md: description of improvement
   Why: what this fixes or improves
```

Actions: CORRECT, EXTEND, CONSOLIDATE, PRUNE, REORGANIZE, TIGHTEN.

Ask the user to confirm before applying. The user may approve all, select specific changes, or modify the plan.

## 6. Apply changes

For each approved change, use Edit to update wiki pages. Follow wiki conventions:

- Write for three audiences
- Use RFC 2119 keywords (MUST/SHOULD/MAY)
- Describe patterns and principles, not raw code
- Link to source files for implementation details
- Keep pages self-contained
- Follow `simpleapps:writing-style`: token-efficient, no filler

If a change requires a new wiki page:
1. Create the page at `wiki/<PascalCase-Name>.md`
2. Add it to `wiki/_Sidebar.md` and `wiki/Home.md`
3. Update `wiki/llms.txt` if it exists

## 7. Final token budget check

Run `wc -w wiki/*.md` again. Compare against the starting count and the active budget from step 1.

- **Final at or under 90% of budget**: clean finish.
- **Final 90%–100% of budget**: flag pruning candidates for the next run. Do not exceed the budget.
- **Final over budget**: STOP. Either prune further now, or surface the budget-increase prompt below.

### Budget increase prompt

When further pruning would remove content the user needs, surface this prompt verbatim:

> "Wiki is at {final} tokens; active budget is {budget}. Further pruning would remove [specific content]. Options:
> (a) prune anyway,
> (b) raise budget to N tokens (records to .simpleapps/settings.json with a reason)."

If the user picks (b):

1. Ask for the reason in one sentence ("Why does this project need a larger wiki budget?")
2. Update `.simpleapps/settings.json` with `wikiTokenBudget: N` and `wikiTokenBudgetReason: "..."`
3. Report the new budget and reason. Both will surface at the top of every future /curate-wiki run.

Never silently raise the budget. Every increase MUST be explicit, reasoned, and recorded.

## 8. Report and stop

Report what changed. MUST NOT commit, push, or offer to commit. This applies to the wiki repo equally. The wiki is a git repo and git-safety applies to ALL repos. Wait for the user to say "commit".

When the user approves, use this process (MUST NOT use `cd`):
1. Write commit message to `tmp/commit-msg.txt` using the Write tool
2. `git -C wiki add -A`
3. `git -C wiki commit -F ../tmp/commit-msg.txt`
4. `rm tmp/commit-msg.txt`
5. Only push if the user says "push"

Report:
- Changes applied (list each with page and action)
- Token budget: before → after (X / {active budget}, reason: {reason if overridden})
- Net improvement summary
