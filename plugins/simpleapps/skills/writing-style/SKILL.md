---
name: writing-style
description: Writing standards for code comments, documentation, specs, PRDs, and team communication. Applies RFC 2119 requirement language and token-efficient writing.
---

# Writing Style

Apply these standards to all written output: code comments, docs, specs, PRDs, wiki pages, commit messages, and team communication.

## RFC 2119 Requirement Language

Spec: https://www.rfc-editor.org/rfc/rfc2119

**Every directive MUST use an RFC 2119 keyword in ALL CAPS.** This applies to wikis, skills, rules, specs, PRDs, issue acceptance criteria, and any content that tells a reader or agent what to do. Agents weight capitalized keywords more reliably than prose — soft language is silently downgraded or ignored.

- **MUST / REQUIRED / SHALL** — absolute requirement, no exceptions
- **MUST NOT / SHALL NOT** — absolute prohibition
- **SHOULD / RECOMMENDED** — strong recommendation, exceptions need justification
- **SHOULD NOT / NOT RECOMMENDED** — discouraged, acceptable with careful reasoning
- **MAY / OPTIONAL** — truly optional, implementer's choice

Decision framework: Does the system break without it? → MUST. Degrades? → SHOULD. No impact? → MAY.

### Conversion table — soft language MUST be rewritten

| Soft phrase | Rewrite as |
|---|---|
| always / never | MUST / MUST NOT |
| be sure to / make sure | MUST |
| don't / do not | MUST NOT |
| don't forget to | MUST |
| needs to / has to | MUST |
| try to / aim to | SHOULD |
| should probably / ideally | SHOULD |
| can / feel free to | MAY |
| avoid | SHOULD NOT |
| remember to | MUST |

### Pre-save checklist

Before saving any directive sentence, confirm it contains one of: MUST, MUST NOT, SHOULD, SHOULD NOT, MAY. If it doesn't, rewrite it or demote it to descriptive prose (no directive verb).

### When lowercase is correct

Use lowercase "should/must/may" only for descriptive prose, not directives: "the build should finish in under a minute" (observation) vs "the build SHOULD finish in under a minute" (requirement). If the sentence tells someone what to do, it's a directive — capitalize.

In CLAUDE.md and skill instructions, use "YOU MUST" or "IMPORTANT" as emphasis markers to improve adherence to critical rules.

### Reading and complying with RFC 2119

Keywords are **binding on the reader**, not suggestions to weigh against convenience. When you encounter a keyword while executing work:

- **MUST / MUST NOT / SHALL / SHALL NOT** — absolute. You MUST NOT downgrade a MUST to a SHOULD because it would take longer, because an example in the session shows otherwise, because the codebase seems to do it differently, or because you judge it unnecessary. The writer chose MUST deliberately. If the requirement seems wrong or impossible, STOP and ask the user — do not silently relax it.
- **SHOULD / SHOULD NOT** — strong default. Deviation requires a stated justification based on facts of the current situation, not convenience or time pressure. "It would take too long" is never a valid justification.
- **MAY** — truly optional. Your choice.

The failure mode this prevents: an agent reads "tests MUST cover the edge case", finds writing the test tedious, and silently demotes it to "tests should cover the edge case where practical". That is the agent overriding the writer. MUST means MUST. If you can't comply, stop and report — do not proceed with a weakened version.

Prior examples in the current session do NOT override a MUST. If session context shows code that violates a MUST from the wiki/skill/spec, the session code is wrong — flag it, do not use it as permission to violate the MUST.

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

## List Ordering

Lists with no inherent order (deny rules, config arrays, feature lists, bullet-point explanations) MUST be sorted alphabetically. Alphabetical order makes items easier to find and minimizes git diffs — new entries slot into a predictable position instead of appending at the end.

Applies to JSON arrays, markdown bullet lists, table rows, and any unordered collection.

## Code Style

Use descriptive variable and function names. Abbreviations save keystrokes but cost readability — the human reviewing your output MUST be able to understand the code without deciphering names. Short names also collide with terminology in the surrounding conversation and confuse the reader (e.g. using `p` as a path variable while the discussion is about a payment path — the reader will read `p` as "payment", not "path").

- MUST use full words: `$groupQuantity` not `$gq`, `cartItem` not `ci`, `filePath` not `p`, `response` not `r`
- MUST NOT use single-letter variable names except loop counters (`i`, `j`, `k`)
- Well-known abbreviations (`id`, `url`, `db`) are fine
- Function names SHOULD describe what they do: `calculateShippingCost` not `calcShip`

## Claude Code Keywords

Thinking trigger words (`think`, `think hard`, `ultrathink`) are deprecated. Extended thinking is on by default. Use `/effort` (low/medium/high/max) for control.
