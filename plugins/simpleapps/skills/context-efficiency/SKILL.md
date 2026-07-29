---
name: context-efficiency
description: How to write token-efficient CLAUDE.md, rules, and skills. Use when creating or editing always-loaded content (CLAUDE.md, .claude/rules/) or authoring skills. Covers the context loading hierarchy, evergreen content principles, and platform limits.
user-invocable: false
---

# Context Efficiency

Always-loaded content (CLAUDE.md, rules without `paths`) is paid on every prompt, even when irrelevant. Every token spent here is a token taken from working context. Write always-loaded content as pointers, not content.

## Context Loading Hierarchy

| Layer | When loaded | What belongs here |
|-------|------------|-------------------|
| CLAUDE.md | Every prompt | Orient + link. Under 200 lines (official limit). |
| Rules (no `paths`) | Every prompt | Short guardrails. One topic per file. Invoke a skill for detail. |
| Rules (with `paths`) | On demand | Scoped guidance that only matters for specific file types. |
| Skills (descriptions) | Every prompt | One-line descriptions. All skills share one listing budget. |
| Skills (full content) | When invoked | Full behavioral detail. Under 500 lines per skill. Stays in context for the rest of the session. |
| Wiki | When read | Complete project knowledge. Unlimited but we budget 20K tokens. |

## Platform Limits

- **CLAUDE.md**: under 200 lines. "Bloated files cause Claude to ignore your actual instructions."
- **Skill listing budget**: **1% of the model's context window**, shared by every skill description. Names are always listed; descriptions are what get trimmed. Raise it with the `skillListingBudgetFraction` setting (e.g. `0.02` = 2%) or set a fixed character count via the `SLASH_COMMAND_TOOL_CHAR_BUDGET` env var.
- **Per-skill description cap**: **1,536 characters**, counting `description` plus `when_to_use` together, applied regardless of remaining budget. Configurable via `skillListingMaxDescChars`. Front-load the trigger keywords; truncation cuts from the end.
- **Overflow behaviour**: when the listing overflows, Claude Code drops descriptions starting with the **least-invoked** skills, so frequently used skills keep their full text. A rarely used skill is the first to lose the keywords that would have triggered it.
- **SKILL.md**: under 500 lines. Move detail to supporting files.
- **Auto memory**: first 200 lines of MEMORY.md loaded. Topic files on demand.
- **Overhead**: a meaningful share of the context window is consumed by system prompt, tool definitions, and autocompact buffer before you type anything. The exact percentage depends on which MCP servers and tools are loaded. Run `/context-audit` to see the current breakdown.

## Frontmatter That Buys Back Budget

Four skill frontmatter fields change what a skill costs. Reach for them before trimming prose:

| Field | Effect on context |
|-------|-------------------|
| `disable-model-invocation: true` | Removes the description from the listing entirely. The skill still runs via `/name`. Best lever for a command-shaped skill Claude should never auto-load. |
| `user-invocable: false` | Hides the skill from the `/` menu but **keeps** the description in the listing. Costs the same as a normal skill; use it for reference skills other skills load, not to save budget. |
| `paths` | Limits auto-activation to matching files. Same idea as a `paths` rule, applied to a skill. |
| `context: fork` | Runs the skill in a subagent. Its work never enters the main context; only the result comes back. |

The pairing that actually frees budget is `disable-model-invocation: true`. `user-invocable: false` alone does not.

## Evergreen Content

Always-loaded content MUST be evergreen, true regardless of when it's read. MUST NOT contain:

- **File counts or lists**: "12 skills" becomes wrong the next commit. Say "check `ls plugins/simpleapps/skills/`" instead.
- **Version numbers**: "currently v2026.03.8" is stale immediately. Point to the VERSION file.
- **Process data**: timestamps, recent activity, who did what. That's git history.
- **Hardcoded paths** that change across machines or environments.
- **Content that duplicates the code**: the code is the source of truth. Describe the pattern, link to the file.

Instead: describe the **pattern**, give **1-2 examples**, and **link** to the source for the current state.

## The Pointer Pattern

Always-loaded files SHOULD be pointers that invoke on-demand content:

```markdown
# Git Safety (rule, 3 lines, always loaded)
MUST NOT commit without user approval.
Load Skill("git-safety") for full guardrails.
```

The rule costs ~40 tokens per prompt. The skill costs nothing until invoked, then loads ~800 tokens of detailed guidance. This is 20x more efficient than putting the full content in the rule.

### Wiki Links: Highest-ROI Pointer

The cheapest pointer with the biggest payoff is a **wiki link in CLAUDE.md**. A link like `[Deployment](../../wiki/Deployment.md)` costs ~15 tokens but gives the agent instant access to a full page of detailed knowledge (~500-2000 tokens) on demand. CLAUDE.md SHOULD link to every wiki content page; it becomes the agent's table of contents. Missing a link means the agent must guess where to find information or ask the user.

## When to Use Each Layer

| Question | Answer |
|----------|--------|
| Does the agent need this on EVERY prompt? | CLAUDE.md or rule |
| Is it a critical guardrail? | Rule (invokes skill for detail) |
| Is it only relevant for certain files? | Rule with `paths` frontmatter |
| Is it detailed behavioral guidance? | Skill |
| Is it shared knowledge across projects? | Wiki |
| Is it personal to one user? | Memory |

## Navigator Tables (SKILL.md)

A lean SKILL.md keeps the description, the always-true gate, and a **navigator** that routes to supporting files for conditional detail. Every navigator row MUST carry **WHEN** (the trigger situation) and **WHY** (the payoff, or the failure it prevents) — not just a topic-to-file mapping. A bare `| Topic | File |` table says which files exist but not whether the agent is in the situation that needs one, so it loads nothing (and misses the detail) or everything (defeating progressive disclosure).

Before — bare, don't:

| Topic | File |
|-------|------|
| Auth | auth.md |

After — carries WHEN/WHY, do:

| When you're… | Load | Why |
|--------------|------|-----|
| adding a login/session flow | auth.md | token-refresh edge cases live here; skipping it ships the 401 retry loop |

Rationale: better routing decisions, a lean SKILL.md, and a cheap forced load where a PreToolUse skill-gating hook forces `Skill('X')` on a matching file touch — the leaner the SKILL.md, the cheaper every forced load.

## Checking Your Budget

Run `/context-audit` to see current token usage by category. Watch for:
- Skill descriptions being trimmed (listing budget exceeded). The symptom is a skill that exists but never auto-triggers.
- CLAUDE.md consuming more than ~5% of context
- Many MCP servers inflating tool definitions
