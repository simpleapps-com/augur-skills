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
| Skills (descriptions) | Every prompt | One-line descriptions. 2% of context window for ALL combined. |
| Skills (full content) | When invoked | Full behavioral detail. Under 500 lines per skill. |
| Wiki | When read | Complete project knowledge. Unlimited but we budget 20K tokens. |

## Platform Limits

- **CLAUDE.md**: under 200 lines. "Bloated files cause Claude to ignore your actual instructions."
- **Skill descriptions**: 2% of context window for all skills combined (16K char fallback). Override with `SLASH_COMMAND_TOOL_CHAR_BUDGET`.
- **SKILL.md**: under 500 lines. Move detail to supporting files.
- **Auto memory**: first 200 lines of MEMORY.md loaded. Topic files on demand.
- **Overhead**: a meaningful share of the context window is consumed by system prompt, tool definitions, and autocompact buffer before you type anything. The exact percentage depends on which MCP servers and tools are loaded. Run `/context` to see the current breakdown.

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

## Checking Your Budget

Run `/context` to see current token usage by category. Watch for:
- Skills being excluded (descriptions exceeded 2% budget)
- CLAUDE.md consuming more than ~5% of context
- Many MCP servers inflating tool definitions
