# Code Contracts — Apply

The six-phase loop for adding contracts to existing code. Use when starting from a function that does not yet carry contracts and you have decided (manually or via `audit.md`) it is load-bearing enough to warrant them.

## When to invoke this

Three triggers:

1. **Audit recommended it.** A `/contract-audit` report named this file as a contract candidate.
2. **You're already editing the file** for unrelated reasons and noticed it deserves contracts. Add them as part of the edit pass; do not split into a separate task.
3. **A bug fix landed here recently.** The fix is the highest-quality signal that the function carries non-trivial invariants worth documenting. Walk the loop after the fix.

MUST NOT invoke broadly. Applying contracts to non-load-bearing code is itself a failure of the practice — it produces JSDoc bloat without the priming or test-surfacing payoff.

## The six phases

Run them in order. Each phase has a discrete output that feeds the next.

### Phase 1: Orient

Read the file's recent history. Bug fixes are bug-locus candidates — they reveal where the invariants matter.

```
git -C repo log --oneline -10 -- <path>
```

Flag any `fix:` commits as locus candidates. For each, read the commit message and the diff — what invariant was being violated? Capture it; phase 3 will turn it into a clause.

Re-verify any wiki rule that may apply (e.g., the project's PHP conventions for contract docblocks, naming conventions, helper patterns) before invoking it. Wiki content drifts; do not rely on stale recall.

**Output:** a short list of candidate invariants pulled from recent fix commits.

### Phase 2: Read

Read three things, in order:

1. **The target file** — full content, not skimmed.
2. **The sibling methods it dispatches to** — if `processOrder` calls `validateLineItems` and `applyTax`, read both.
3. **The heaviest callers** — find the top three call sites and read enough of each to understand what they assume about this function's behavior.

Reasoning from method names alone produces false recommendations. The contract clauses MUST come from observed behavior (the body) AND observed assumptions (the call sites). Skip this phase and the contracts will be plausible-but-wrong — the worst kind of contract.

**Output:** a working understanding of what the function actually does, what its callers assume, and any drift between intent and implementation.

### Phase 3: Draft

Write the contract clauses, clause-first.

For load-bearing files, write a **file-level docblock** that frames the file's role in the system. For each load-bearing method, write a per-method contract:

```php
/**
 * @requires <precondition>          (ASCII gloss)
 * @ensures  <postcondition>          (ASCII gloss)
 * @invariant <property>              (ASCII gloss, where applicable)
 *
 * Footgun: <named footgun from phase 1 or 2 — bug that hit, sentinel ambiguity, etc.>
 *          (ASCII gloss of the footgun)
 */
```

Use Unicode glyphs paired with ASCII gloss per the dual-audience pattern in `SKILL.md`. See `vocabulary.md` for the glyph palette and per-language examples.

Cite specifics:

- The bug-fix commit (e.g., "Footgun: see fix in <sha> — empty array vs single-zero array were silently the same precondition")
- Sibling files where applicable (e.g., "see `OrderTotal.php` for how the result is consumed")
- Wiki rules where they apply (file:line citations)

**Output:** a draft docblock per load-bearing method, plus a file-level overview if the file's role warrants one.

### Phase 4: Trim

Cut anything an agent could recover from reading the code itself. The contract MUST add information, not restate the implementation.

Concrete cuts:

- Postconditions that mirror the constructor (e.g., `@ensures result.kind === 'loaded'` on `function loaded(item) { return { kind: 'loaded', item } }`) — drop them.
- Range assertions that the type system already enforces (`@requires q ≥ 0` when the parameter type is `Natural`) — drop them.
- Prose that narrates the body (`// loop builds the running sum`) — drop them.
- Comments that explain syntax (`// using ?? for default`) — drop them.

What stays:

- Footguns that aren't visible in the body (sentinel ambiguities, cross-file trust boundaries, ordering invariants, conservation properties)
- Algebraic laws (idempotence, commutativity, monotonicity)
- Cross-method invariants
- Anything a future reader would not derive from the body alone

**Output:** a tight contract that earns every line.

### Phase 5: Discover

Ask: **what invariant did you surface that does not belong in this docblock but should be captured as a wiki rule?**

The discover phase is the highest-leverage step and the easiest to skip. While writing contracts, you often surface unstated conventions — a parameter ordering rule, a naming convention, a trust assumption that applies across many files. These do not belong in any one docblock but are the kind of knowledge that evaporates on `/clear`.

For each discovered convention:

- Decide where it belongs (project wiki page, shared skill, a `README.md` next to the code)
- Write it down (or offer to write it down — the user MAY want to phrase it themselves)
- Cite the file/line that surfaced it

**Output:** zero or more wiki-bound captures, written or queued.

Examples of the kind of invariants this phase catches:

- A `$siteId`-first-parameter rule across helper functions that was implicit in the code but not documented
- A trust assumption that strings labeled "internal" never reach SQL without going through a quoter — true in practice, undocumented
- A "delete flag is `'Y'`, never `null`" convention that the code relies on but no test or comment names

### Phase 6: Verify

For each clause written in phase 3 (and not cut in phase 4), ask: **what tests does this clause demand that the test suite does not yet have?**

Walk the clauses:

- Each `@requires` → name the missing input-boundary tests (negative inputs, NaN, empty, max, etc.)
- Each `@ensures` → name the missing output-property assertions
- Each `@invariant` → name the missing multi-step tests that exercise the invariant across call sequences
- Each `@trusted` → name the missing fuzz cases on untrusted-input simulation
- Each `@time O(...)` / `Θ(...)` → name the missing scaling benchmark (assert the bound holds at n=10, n=100, n=1000)
- Each `@space O(...)` / `Θ(...)` → name the missing memory-stability test across input sizes

This phase is the test-gap report for the contract. It is parallel to phase 5: phase 5 captures wiki-bound knowledge gaps, phase 6 captures test-bound knowledge gaps. Complexity-claim gaps are especially load-bearing — an unverified `@time Θ(n)` claim drifts to `O(n²)` silently across refactors.

The output of phase 6 is a list of tests to write. **Do not write them in this loop** — that's a separate task. The list is the artifact; whether the user writes the tests now or later is their call.

**Output:** a list of missing tests, one per clause, ordered by which would catch the most likely class of regression first.

## Convention authority

The PHP-side convention for contract docblocks lives in `wiki/PHP-Conventions.md § Contract Docblocks for Load-Bearing Methods` (in the originating repo's wiki). MUST cite that page rather than duplicating its content here. This skill's role is the *workflow*; the *convention* is a per-repo artifact.

For TS and Python, the conventions are folded directly into `SKILL.md` and `vocabulary.md` because those languages do not yet have a per-repo conventions page that lives elsewhere.

## Canonical examples

Reference the existing contracted methods so an agent can model new work on a verified example:

- `packages/roark/src/MathUtils.php::normalizeL2`
- `packages/roark/src/StringUtils.php::makeKey`
- `packages/roark/src/Helpers/CacheHelper.php` (file-level overview plus `tryLock`, `lock`, `isLocked`, `get`, `getLockKeyByName`)
- `packages/roark/src/Enums/CacheTtl.php` (file-level overview plus `toSeconds`)
- `packages/roark/src/Enums/StatusChar.php` (file-level overview plus `description`)
- `packages/open_search/src/Helpers/ItemsHelper.php` (file-level overview plus `applyIndexAction`, `getIndexAction`, `modifyIndex`)

(All paths are in the `simpleapps-com/augur` repo. Cross-repo read may be needed; the WIP-side `code-contracts-cluster.md` notes this as an open item.)

## Reference

- `SKILL.md` — the writing skill (auto-triggered on load-bearing edits) and the three-mechanism framing
- `vocabulary.md` — full glyph palette + clause-first derivation table + per-language examples
- `audit.md` — the audit modes (per-file + session-aware)
