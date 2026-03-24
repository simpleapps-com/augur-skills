---
name: curate-wiki
description: Continuously improve the project wiki — better content, context, organization, and usability within the 20K token budget
allowed-tools: Bash(git -C:*), Bash(wc:*), Bash(rm:*), Skill(wiki), Skill(git-safety), Skill(bash-simplicity), Skill(context-efficiency), Read, Write, Glob, Grep, Edit, Agent
---

First, use Skill("wiki") to load wiki conventions, Skill("git-safety") to load git guardrails, Skill("bash-simplicity") for Bash conventions, and Skill("context-efficiency") for always-loaded content guidelines.

Curate the project wiki. This is an ongoing improvement process — each run makes the wiki clearer, more accurate, better organized, and more useful for its three audiences (junior devs, senior devs, AI agents). The wiki MUST stay within its 20K token budget so it can be loaded into context without consuming the working window.

The working code is the ground truth. The current session is the hint where to start — use what was learned, discussed, or changed this session to guide where the wiki most needs attention. Then verify against the actual codebase.

**MUST complete ALL steps below in sequence without stopping.** Do not pause between steps or wait for prompts — run through the entire process, stopping only at step 5 (approve changes) and step 8 (approve commit/push).

## 1. Check token budget

Run `wc -w wiki/*.md`. Multiply total by 1.3 for token estimate. Record the current usage — this is the budget you have to work within. Every change MUST keep the wiki under 20K tokens.

## 2. Load the wiki

Use Glob to find all `wiki/*.md` files. Read every page using the Read tool — the full wiki MUST be in context.

## 3. Assess the wiki

Evaluate each page against the wiki conventions (from the wiki skill) and the current codebase. Look for improvement opportunities in six areas:

### Content quality
- Are statements accurate? Verify claims against the actual code using Grep, Glob, Read, or Agent with subagent_type=Explore.
- Is anything missing that the current session revealed?
- Are explanations clear for all three audiences?
- Does `Testing.md` exist? If not, suggest creating one. If it does, update it with any testing knowledge from this session — new edge cases, failure patterns, test data, or verification steps discovered during implementation or debugging.

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
Cross-linking is the most important structural feature — it turns a collection of files into a knowledge graph. Assess aggressively:
- Does every page link to related sections on other pages?
- Are concepts that are explained elsewhere linked with `[[Page-Name#section]]`?
- Are there pages with few or no outbound links? These are isolated nodes that need connecting.
- Are there pages that should be linked TO but aren't referenced from related pages?

### Usability
- Can a reader quickly find what they need?
- Are tables, code blocks, and RFC 2119 keywords used effectively?
- Are pages self-contained or do they require jumping between pages?

### Consolidation
- Is there duplicated or scattered information that should be merged?
- Are there overlapping pages that should be combined?

### Pruning
- Is there outdated content that no longer matches reality?
- Is there filler or verbose text that can be tightened?
- Can anything be removed to free token budget for higher-value content?

## 4. Audit always-loaded content

Check `repo/.claude/CLAUDE.md` and `repo/.claude/rules/*.md` against the context-efficiency skill. These files load on every prompt — they MUST be lean, evergreen, and follow the pointer pattern.

Read each file and check:
- **Line count**: `wc -l repo/.claude/CLAUDE.md` — MUST be under 200 lines (official platform limit)
- **Evergreen violations**: hardcoded file counts, version numbers, timestamps, process data, or content that duplicates the code
- **Pointer pattern**: rules SHOULD be short triggers that invoke a skill for detail. Flag any rule that contains full behavioral guidance instead of invoking a skill.
- **Staleness**: claims that no longer match reality (verify against the codebase)
- **Duplication**: content that duplicates what's in the wiki or a skill

Include any issues found in the proposal alongside wiki changes.

## 5. Propose changes

Present a prioritized list of improvements:

```
N. [ACTION] Page.md — description of improvement
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
- Follow `simpleapps:writing-style` — token-efficient, no filler

If a change requires a new wiki page:
1. Create the page at `wiki/<PascalCase-Name>.md`
2. Add it to `wiki/_Sidebar.md` and `wiki/Home.md`
3. Update `wiki/llms.txt` if it exists

## 7. Final token budget check

Run `wc -w wiki/*.md` again. Compare against the starting count. If over 18K tokens, identify content to prune or tighten before finishing. The wiki MUST NOT exceed 20K tokens.

## 8. Report and stop

Report what changed. MUST NOT commit, push, or offer to commit — this applies to the wiki repo equally. The wiki is a git repo and git-safety applies to ALL repos. Wait for the user to say "commit".

When the user approves, use this process (MUST NOT use `cd`):
1. Write commit message to `tmp/commit-msg.txt` using the Write tool
2. `git -C wiki add -A`
3. `git -C wiki commit -F ../tmp/commit-msg.txt`
4. `rm tmp/commit-msg.txt`
5. Only push if the user says "push"

Report:
- Changes applied (list each with page and action)
- Token budget: before → after (X / 20,000)
- Net improvement summary
