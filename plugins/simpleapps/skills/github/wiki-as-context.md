# Wiki as Context

The GitHub wiki is the **single source of truth** for how a project works. It is not an afterthought or a place to dump notes — it is the primary context that drives development.

## The Problem

Documentation scattered across a codebase creates friction:

- `.claude/rules/` files, README.md, inline comments, and docs/ folders all compete as sources of truth
- AI agents waste tokens reading large files to find relevant context
- New team members don't know where to look
- Docs rot because they live next to code and get forgotten

## The Solution

The wiki is the **spec**. The repo is the **implementation**.

| Wiki | Repo |
|------|------|
| Architecture decisions | Code that implements them |
| API specs | API code |
| Conventions and standards | Code that follows them |
| Onboarding guides | Nothing — wiki is self-contained |
| Release processes | Automation scripts |
| Full explanations | Minimal pointers back to wiki |

## How It Works

### 1. Wiki First

When starting new work, check the wiki first. If the wiki doesn't cover it, write the wiki page before writing code. The wiki defines *what* and *why*. The code implements *how*.

### 2. Repo References Wiki

Repo files (`.claude/CLAUDE.md`, `.claude/rules/`, `README.md`) SHOULD be **minimal** — just enough to orient, then point to the wiki for details.

```markdown
# Versioning

Full docs: ../../../wiki/Versioning.md

`VERSION` file = source of truth. All version fields MUST match.
```

### 3. AI Agents Read Wiki Locally

Because the wiki is cloned alongside the repo (see `project-structure.md`), AI agents read wiki pages as local files. No network requests, no URL fetching — just `Read ../../../wiki/Architecture.md`.

This means wiki pages are both human documentation AND machine context.

### 4. Wiki Evolves with the Project

The wiki is not write-once. As the codebase changes:

- Update affected wiki pages in the same work session
- Add new pages when new patterns emerge
- Remove pages when features are deprecated
- Keep the `_Sidebar.md` current

## Three Audiences

Every wiki page serves three audiences simultaneously:

| Audience | What they need | How they read |
|----------|---------------|---------------|
| **Junior devs** | Explanations of *why*, step-by-step instructions, examples they can copy | Top to bottom, following links for context |
| **Senior devs** | Quick reference, architecture decisions, conventions to follow | Scan for the section they need, skip the rest |
| **AI agents** | Unambiguous specs, exact commands, clear requirements (MUST/SHOULD/MAY) | Load the full wiki into context, act on it |

### Writing for All Three

- **Lead with a summary** — seniors and agents get what they need fast, juniors get orientation
- **Explain the *why* before the *how*** — juniors learn the reasoning, seniors confirm their assumptions, agents get decision context
- **Use tables for reference data** — scannable for seniors, parseable for agents, structured for juniors
- **Use code blocks for anything copy-pasteable** — all three audiences benefit from exact commands
- **Use RFC 2119 keywords (MUST/SHOULD/MAY)** — removes ambiguity for everyone, especially agents
- **Include examples** — juniors learn by example, agents use them as patterns

### Keep Pages Self-Contained

Each page SHOULD make sense on its own. A junior dev landing on any page SHOULD be able to understand it without reading the rest of the wiki.

### Follow the Writing Style Skill

All wiki content MUST follow the `simpleapps:writing-style` skill:

- **RFC 2119 keywords** — MUST/SHOULD/MAY in ALL CAPS for requirements, lowercase for casual suggestions
- **Token efficiency** — action verbs first, no filler, specific over generic, Bottom Line Up Front
- **Developer-facing tone** — technical and concise, include file references and acceptance criteria
- **Expand for onboarding and architecture** — juniors and future devs need the "why"
- **Cut everywhere else** — two sentences that answer the question beat two pages that fill the context window

The wiki is developer-facing documentation. It is NOT client-facing. Write for devs and AI agents, not for non-technical readers.

### Link with Anchor Precision

When referencing other wiki pages, MUST link directly to the relevant section using `#` anchors — not just the page.

```markdown
# Good — links to exact section
See [[Versioning#version-bump-procedure]] for the step-by-step process.
Check [[Architecture#three-layers]] for how marketplace, plugins, and CLI relate.

# Bad — links to top of page, reader has to hunt
See [[Versioning]] for details.
Check [[Architecture]] for more info.
```

This matters for two reasons:
- **Devs** jump straight to the answer instead of scrolling through a page
- **AI agents** use anchor links as an attention signal — a `#section` reference tells the agent exactly which part of a page is relevant to the current task, reducing noise in a 20K token wiki

### The 20K Token Budget

The entire wiki MUST stay under **20K tokens** (~60KB of markdown). This is a hard constraint, not a guideline.

Why 20K: with a 200K token context window, the full wiki never exceeds 10% of available context. This means an AI agent can load the **entire wiki** into active context at the start of a session and keep it there throughout. No selective loading, no missed context, no stale references — the agent always has the complete picture.

If the wiki approaches the budget:
- Tighten language — cut filler, use tables over prose
- Merge overlapping pages
- Move implementation details back to code comments where they belong
- Archive obsolete pages (delete, don't hoard)

To check the current budget:
```bash
wc -c {project}/wiki/*.md
```

Rough conversion: 1 token ≈ 3 bytes of markdown. So 20K tokens ≈ 60KB.

### Right-Size Each Page

- Too short = missing context, agent has to search elsewhere
- Too long = wasted tokens, buried signal
- Target: enough to act on without reading anything else

## The Feedback Loop

```
Wiki defines → Code implements → Learnings update wiki → Repeat
```

When code reveals that the wiki is wrong or incomplete, update the wiki immediately. The wiki MUST reflect reality, not aspirations.

## When to Update the Wiki

- **New feature** — Write the wiki page first (spec), then implement
- **Bug fix** — If the fix reveals a gap in documentation, update the wiki
- **Architecture change** — Update Architecture page before or during the change
- **New convention** — Add to the relevant wiki page so the team adopts it
- **Onboarding friction** — If someone asks "where is X?", the answer should be a wiki link. If it's not, create the page.

## Anti-Patterns

| Don't | Do |
|-------|-----|
| Write long README.md files in the repo | Minimal README + wiki link |
| Duplicate wiki content in `.claude/rules/` | Thin rules that reference wiki |
| Leave wiki pages stale after code changes | Update wiki in the same session |
| Use the wiki as a dumping ground for notes | Structure pages with clear purpose |
| Write wiki pages only humans can understand | Write for both humans and AI agents |
