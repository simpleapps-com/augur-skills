---
name: curate-wiki
description: Continuously improve the project wiki — better content, context, organization, and usability within the 20K token budget
allowed-tools: Bash(git -C:*), Bash(wc:*), Bash(rm:*), Skill(wiki), Read, Write, Glob, Grep, Edit, Agent
---

First, use Skill("wiki") to load wiki conventions and constraints.

Curate the project wiki. This is an ongoing improvement process — each run makes the wiki clearer, more accurate, better organized, and more useful for its three audiences (junior devs, senior devs, AI agents). The wiki MUST stay within its 20K token budget so it can be loaded into context without consuming the working window.

The working code is the ground truth. The current session is the hint where to start — use what was learned, discussed, or changed this session to guide where the wiki most needs attention. Then verify against the actual codebase.

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

### Context
- Does each page explain *why*, not just *what*?
- Are decisions documented with rationale?
- Can an AI agent reading this page act on it without ambiguity?

### Organization
- Is information in the right place? Would readers find it where they expect?
- Are there sections that belong on a different page?
- Is the sidebar navigation logical and complete?

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

## 4. Propose changes

Present a prioritized list of improvements:

```
N. [ACTION] Page.md — description of improvement
   Why: what this fixes or improves
```

Actions: CORRECT, EXTEND, CONSOLIDATE, PRUNE, REORGANIZE, TIGHTEN.

Ask the user to confirm before applying. The user may approve all, select specific changes, or modify the plan.

## 5. Apply changes

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

## 6. Final token budget check

Run `wc -w wiki/*.md` again. Compare against the starting count. If over 18K tokens, identify content to prune or tighten before finishing. The wiki MUST NOT exceed 20K tokens.

## 7. Commit and report

Ask the user if they want to commit. MUST NOT use `cd`. Write commit message to tmp file, commit with `-F`, then clean up:

```bash
# Stage
git -C wiki add -A

# Write commit message using Write tool → tmp/commit-msg.txt
# Then commit with -F
git -C wiki commit -F tmp/commit-msg.txt

# Clean up
rm tmp/commit-msg.txt

# Push
git -C wiki push
```

Report:
- Changes applied (list each with page and action)
- Token budget: before → after (X / 20,000)
- Net improvement summary
