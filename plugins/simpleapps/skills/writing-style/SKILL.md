---
name: writing-style
description: Writing standards for code comments, documentation, specs, PRDs, and team communication. Applies RFC 2119 requirement language and token-efficient writing.
---

# Writing Style

Apply these standards to all written output: code comments, docs, specs, PRDs, wiki pages, commit messages, and team communication.

## RFC 2119 Requirement Language

Spec: https://www.rfc-editor.org/rfc/rfc2119

Use ALL CAPS when invoking requirement levels:

- **MUST / REQUIRED / SHALL** — absolute requirement, no exceptions
- **MUST NOT / SHALL NOT** — absolute prohibition
- **SHOULD / RECOMMENDED** — strong recommendation, exceptions need justification
- **SHOULD NOT / NOT RECOMMENDED** — discouraged, acceptable with careful reasoning
- **MAY / OPTIONAL** — truly optional, implementer's choice

Use lowercase for casual suggestions: "you should consider..." vs "you SHOULD implement..."

Decision framework: Does the system break without it? → MUST. Degrades? → SHOULD. No impact? → MAY.

In CLAUDE.md and skill instructions, use "YOU MUST" or "IMPORTANT" as emphasis markers to improve adherence to critical rules.

## Token Efficiency

Every token costs time, money, and cognitive load. Be concise without losing clarity.

**Rules:**
1. Start with action verbs: fix, add, update, remove
2. Use file:line references: `auth.ts:45` not "authentication file line 45"
3. Eliminate filler: actually, basically, in order to, it's worth noting
4. Choose specific over generic: "Redis cache" not "caching solution"
5. Bottom Line Up Front — lead with the answer, then context

**By audience:**
- **Client-facing (Basecamp)**: Plain language, no jargon, explain impact not implementation. The reader is non-technical — write for clarity over brevity.
- **Developer-facing (GitHub issues, PRs, wiki)**: Technical and concise. Convey context for developers and AI agents — include file references, reproduction steps, and acceptance criteria.
- **Internal (code comments, commits)**: Minimal. Reader has full codebase context.

**By format:**
- **PRDs**: Bullet points, not paragraphs
- **Specs**: Lead with requirements (MUST/SHOULD/MAY)
- **Tasks**: Action verb + target
- **Code comments**: Only where logic isn't self-evident
- **Reviews**: What changed, not why

**When to expand:**
- User stories, onboarding docs, error messages — reader has no prior context
- Architecture decisions — future developers need the "why"
- External-facing docs — audience can't ask follow-up questions

**When to cut:**
- Internal specs, tasks, code comments — reader has shared context
- Commit messages, PR titles — scanning speed matters
- Anything repeating what the code already says

Default to brief. Expand only when the reader cannot infer meaning from context. Two sentences that answer the question beat two pages that fill the context window.

## Claude Code Keywords

Thinking trigger words (`think`, `think hard`, `ultrathink`) are deprecated. Extended thinking is on by default. Use `/effort` (low/medium/high/max) for control.
