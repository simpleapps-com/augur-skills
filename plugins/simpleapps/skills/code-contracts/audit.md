# Code Contracts — Audit

The audit modes invoked by `/contract-audit`. Two modes; pick by argument:

| Mode | Trigger | What it does |
|------|---------|--------------|
| **Per-file** | `/contract-audit <file>` | Walks the file for security seams and contract gaps; produces contracts and a test-gap report |
| **Session-aware** | `/contract-audit` (no args) | Scans files **read or written in this session**; for each, evaluates load-bearing-ness, existing contracts, and recommendation |

The session-aware mode is the high-leverage one: it surfaces contract candidates *while context is fresh*, instead of relying on the user to remember to run the audit later.

## Frame the audit as bug discovery, not documentation

The exercise's value is the discipline of writing contracts forcing real bugs to surface. The annotations themselves are a secondary artifact. Every audit MUST produce a *report*, not auto-applied annotations — the human stays in the loop on what to annotate vs. fix.

## Per-file audit

For a given file, walk these four questions in order:

### 1. Where do types not capture a runtime constraint?

Look for:

- `string` parameters inlined into SQL, HTML, shell, or other security-sensitive sinks — trusted vs. untrusted origin is invisible
- Coupled optional fields (e.g. `afterKey` requires `afterKeyColumn`)
- Non-null assertions (`!`) load-bearing on a runtime guard
- Sentinel values (`-1`, `0`, `999`, empty string) carrying domain meaning the type cannot express
- Number that should be ℕ, ℤ⁺, or a refinement (e.g. percentage in `[0, 100]`)
- Loops over inputs of unknown size — implicit `O(n)` or `O(n²)` claims with no contract to make the cost visible

For each finding, propose a contract clause AND the type-level fix that would make the clause unnecessary (the order-of-preference rule from `SKILL.md`). For complexity findings, propose `@time` / `@space` clauses *and* flag the function as a refactor candidate if the asymptotic class is plausibly improvable (e.g., nested-loop O(n²) where a hash-keyed O(n) is reachable).

### 2. Does the function's name and docstring match its actual behavior?

Read the function name, its docstring (if any), and its body. Look for:

- Plural names returning singular results (e.g. `guardrailPlugins` returning one plugin)
- Verbs that misstate the operation (`getX` that mutates, `isX` that returns a string)
- Docstrings describing intent that the body doesn't enforce
- Function that does N+1 things when the name promises 1

For each finding, decide: rename the function OR rewrite the body. Drift between name and behavior is a defect by the same rule that applies to contracts.

### 3. Does this file produce values consumed elsewhere with implicit contracts?

This is the **highest-value finding** and the hardest to surface. Walk every value the file emits — return values, exported constants, structures pushed into shared state, strings written to global queries, fields assigned on shared objects.

For each emitted value, ask:

- Where is it consumed? (Other files in the repo)
- What does the consumer assume about its shape, format, sanitization, or origin?
- Is that assumption written down anywhere?

The producer/consumer pair has an *implicit contract* in the gap. Surface it. Either annotate the producer with a `@trusted`/`@ensures` clause, or harden the consumer to defend against violation. Cross-file trust boundaries are where the worst bugs live.

### 4. For each contract this audit produces, what tests does the contract demand that the test suite does not yet have?

This is the test-gap report. For each clause from questions 1–3:

- `@requires` → list missing input-boundary tests (negative inputs, NaN, empty, max, etc.)
- `@ensures` → list missing output-property assertions
- `@invariant` → list missing multi-step tests that exercise the invariant across calls
- `@trusted` → list missing fuzz cases on untrusted-input simulation
- `@time O(...)` / `@time Θ(...)` → list missing scaling benchmarks (assert the bound holds at n=10, n=100, n=1000)
- `@space O(...)` / `@space Θ(...)` → list missing memory-stability tests across input sizes

The test-gap pass turns the audit from "find bugs" into "find bugs *and* find the test that would have caught them next time." Complexity-claim gaps are especially load-bearing — without scaling tests, the claim is unfalsifiable and an `O(n²)` regression slips into an `O(n)`-claimed function unchecked.

## When NOT to annotate

This section MUST appear in every audit report, before the per-section findings. Without it, the audit produces JSDoc bloat instead of signal.

Skip annotations on:

- **Pure transforms whose contract is fully expressed in the type signature.** A function `(n: NonZero) => number` already says `@requires n !== 0` in the type — no comment needed.
- **Test files.** The test name is the spec. Annotating tests adds noise.
- **Generated code.** Don't annotate; the generator is the spec.
- **One-off scripts and throwaway code.** Not load-bearing; not worth the context cost.
- **Glue code, plumbing, framework adapters, UI components, getters/setters.** Same scope rule as `SKILL.md`.

If the comment would just restate the type, it MUST NOT be added. The audit's signal is bugs surfaced and gaps in tests, not annotation count.

## Output format

Every audit produces a markdown report with this structure:

```markdown
# Audit: <file or session>

## Scope
<file paths audited; load-bearing assessment per file>

## When NOT to annotate (carryover)
<note any patterns in this audit that fall in the skip list — pure transforms whose type already says it, tests, generated, etc.>

## Findings

### 1. Types that don't capture runtime constraints
<list per-file findings; for each, propose contract + type-level fix>

### 2. Name / docstring drift
<list per-file findings; for each, propose rename OR body fix>

### 3. Cross-file trust boundaries (highest-value)
<list producer/consumer pairs with implicit contracts; propose @trusted/@ensures on the producer or hardening on the consumer>

### 4. Test gaps
<list per-finding tests that the proposed contracts demand and the suite does not have>

## Suggested next steps
<ordered list — usually: fix bugs found in section 1, address drift in 2, harden boundaries in 3, write missing tests in 4>
```

The audit is **read-only**. MUST NOT auto-apply contracts or modify code or tests. The human reviews the report and decides what to act on.

## Session-aware mode

When `/contract-audit` is invoked with no arguments, run a session-aware scan instead of per-file.

### Discover the candidate set

Look at the files **read or written in this session** (using session context, recent tool-call history, or open editor state). Filter to:

- Source files in `repo/` (not test files, not config, not generated)
- Files with at least one substantive read or edit this session
- Files large enough to plausibly contain load-bearing functions (skip files < ~50 lines unless the agent has reason to believe they're security-critical)

### Score each file

For each candidate, evaluate:

| Dimension | Question |
|-----------|----------|
| Load-bearing-ness | Does this file contain money math, auth, concurrency, state machines, security boundaries, or non-trivial algorithms? |
| Existing contracts | Are there already `@requires` / `@ensures` / `@invariant` / `@trusted` clauses? |
| Worth adding | If no contracts present, would adding them surface a bug or fill a test gap? |

The agent has been in the file's context this session — use that. Don't re-derive load-bearing-ness from cold.

### Output: ranked recommendations

Produce a ranked list:

```markdown
# Session-aware contract audit — N candidates

## Recommended (highest leverage)

1. **`<path>`** — <one-line rationale: load-bearing reason + observed gap>
   Suggested action: <add contracts to function X; harden the boundary at line Y; etc.>

2. **`<path>`** — ...

## Already covered

<files with contracts already in place — note any drift the agent observed during the session>

## Skip (not load-bearing)

<files in the candidate set that don't meet the scope rule; brief reason>
```

Keep the rationale short. The user picks the top item and runs `/contract-audit <path>` to do a per-file deep dive.

### Why this mode pays off

The user does not have to remember to run an audit. The agent surfaces candidates while the context is fresh. Mechanism #3 (agent-reported value) operationalizes here — the agent saw the file in this session and can score it; a cold audit cannot.

## Reference

- `SKILL.md` — the writing skill (auto-triggered on load-bearing edits)
- `vocabulary.md` — full glyph palette + clause-first derivation table + per-language examples
- `apply.md` — six-phase loop for adding contracts to existing code (when this audit recommends "add contracts to function X")
