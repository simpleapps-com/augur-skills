---
name: code-contracts
description: When working in load-bearing code (the 5-10% where correctness matters most — money math, auth, concurrency, state machines, security boundaries), tighten the type system first, then add formal contracts (@requires/@ensures/@invariant/@trusted) in the host language's native comment syntax. Use Unicode glyphs (∀, ∈, ≥, ℕ) for AI priming, paired with ASCII gloss for human readers. The contracts pay off through three independent mechanisms: priming agent reasoning, surfacing tests, and adding context-window value that agents themselves report. Drift between contract and code is a defect.
---

# Code Contracts

> **Status: EXPERIMENTAL** for the priming hypothesis (mechanism #1). The test-surfacing (#2) and agent-reported-value (#3) mechanisms are observed in practice. Apply selectively to load-bearing code; treat as a defensible bet across three channels — pays off if any one of them lands.

Persistent prompt engineering encoded in source code. Formal contracts on load-bearing functions pay off through three independent mechanisms.

## Three mechanisms — why this is worth the context cost

| # | Mechanism | What it does | Status |
|---|-----------|--------------|--------|
| 1 | Latent-space priming | Unicode glyph rarity pulls hidden state toward the formal-methods neighborhood — sharper reasoning on the *next edit* | Hypothesis (defensible bet) |
| 2 | Test surfacing | Explicit clauses make intent legible — agents generate *new and better tests* using each clause as an oracle | **Observed in practice** |
| 3 | Agent-reported value | Agents themselves report that contracts add useful context for complex / load-bearing methods | **Observed in practice** |

The contracts are the artifact. The three mechanisms are *consequences*. Even if mechanism #1 is weaker than hoped, mechanisms #2 and #3 are already paying off.

## What this is — and is not

This is **not** documentation. It is **not** a parallel comment style for human readers alone. It is a cognitive switch that targets future agents reading the file, paired with an ASCII gloss that bridges human readers.

Models trained on F\*/Lean/Dafny/Coq corpora develop a "spec-then-implement" reasoning policy — slower, more rigorous, explicit about pre/postconditions and effects. Plain TS/PHP/Python does not activate that policy because the surface form does not match. Unicode-heavy contract prose in the same file *does* match — the model upshifts into the more rigorous mode for the function it precedes.

The annotations do not add information the model could not infer. They change the *mode* the model reasons in. Same idea as "let's reason step by step" or "you are an expert at X" — moved out of the system prompt and into the artifact, where it primes every future agent that touches the code, not just the current session.

## When to use it

MUST apply ONLY in **load-bearing code** — the 5-10% of functions where a subtle bug compounds:

- Money math (pricing, tax, fees, totals, currency conversion, rounding)
- Auth and permission decisions
- Concurrency and ordering (locks, queues, retries, idempotency keys)
- State machines and protocols (multi-step flows that must not be entered out of order)
- Security boundaries (input validation at trust boundaries, sanitization, sinks like SQL/HTML/shell)
- Algorithms with non-trivial invariants (custom sort/search variants, bespoke data structures)

MUST NOT apply by default to:

- Getters, setters, simple field accessors
- Glue code, plumbing, framework adapters
- UI components, presentational code
- One-off scripts, throwaway code
- Test bodies (the test name is the spec)

Annotation density has a real context-window cost on every read. MUST concentrate it where the rigorous-reasoning upgrade matters most.

## Two surfaces per clause

Every clause has two surfaces riding the same line:

| Surface | Purpose |
|---------|---------|
| **Formal** (Unicode) | Activates the rigorous-reasoning latent circuits in readers with the bandwidth to parse it. Rarity is the activation. |
| **Prose** (gloss + assumptions) | Renders the same content as natural language **with assumptions named**, so readers with less parsing bandwidth derive the same conclusions without paying a notation tax. |

These are not redundant translations. **The prose surface carries assumptions, not just symbols.**

### The gloss MUST name assumptions

When a clause depends on something the formal notation does not make explicit — a precondition the caller is presumed to satisfy, a sentinel value the contract treats as out-of-scope, a side condition the body relies on — the gloss MUST name it. Naming what is *not* part of the contract is as important as naming what is.

The formal notation cannot say "and X is assumed to hold." The gloss can. Examples:

- `@requires q ≥ 0  // q is non-negative; assumes caller validated input, no NaN check here`
- `@ensures result ∈ ℕ  // result is a non-negative integer; overflow is caller's responsibility`
- `@invariant balance ≥ 0  // balance never negative; assumes no concurrent mutators outside this lock`

Without explicit assumption-naming, a reader must derive the assumptions from negative space — by inspecting callers, the implementation, related tests. That derivation is the parsing tax that costs careful reasoning capacity. The gloss eliminates the tax by naming it directly.

### Why both surfaces

Dense formal notation can crowd out attention to factual claims when parsing it costs the reader most of their bandwidth — the cognitive cost of parsing symbols leaves less capacity for engaging with what the contract actually says. Pairing the formal surface with prose-and-assumptions means:

- Readers with high parsing bandwidth get the formal surface activating careful reasoning **plus** the gloss catching what the formal notation leaves implicit
- Readers with less parsing bandwidth derive the same conclusions from the prose alone, no tax paid
- Either reader gets a working contract; neither is left to derive the assumptions from negative space

This is also why the gloss helps human readers: a junior dev seeing `∀ x ∈ xs. x ≥ 0` cold has nowhere to grab. The same dev seeing `∀ x ∈ xs. x ≥ 0  // every x in xs is non-negative; assumes upstream validation` reads it once and starts building intuition for the symbol set with the assumptions made explicit.

### Two pairing patterns

Pick one and apply consistently within a file.

```ts
// Pattern A — inline assumption-naming gloss after the formal clause
@requires q ≥ 0           // q is non-negative; assumes caller validated input
@ensures  result ∈ ℕ       // result is a natural number; overflow is caller's responsibility
```

```ts
// Pattern B — bracketed gloss on the same line
@requires q ≥ 0  (q is non-negative; assumes caller validated input)
@ensures  ∀ x ∈ items. x.qty ≥ 0  (every item has non-negative qty; empty array is allowed)
```

Pattern A is denser; Pattern B reads more like prose. Either works.

See `vocabulary.md` for the full glyph palette, the clause-first derivation table, and per-language examples.

## Order of preference

When a function deserves a contract, work down this list. MUST use the first form that expresses the property; SHOULD fall back to looser forms only when the tighter one cannot.

### 1. Tighten the type system first

A type the compiler enforces beats a comment the compiler ignores. The model reads types the same way it reads contracts.

```ts
// Loose type with comment contract
// @requires y !== 0
function divide(x: number, y: number): number { return x / y; }

// Branded type that makes the precondition unrepresentable
type NonZero = number & { readonly __brand: 'NonZero' };
function divide(x: number, y: NonZero): number { return x / y; }
```

Tools by language:

- **TypeScript** — branded types, narrow union types, `readonly`, template literal types, exhaustive `switch` over discriminated unions
- **PHP** — typed properties, `readonly`, enums (8.1+), Psalm template types
- **Python** — `Literal`, `Final`, `NewType`, `Annotated`, `Protocol`, `assert_never`

### 2. Use the language's checker-enforced annotation

When the type system cannot express the property, reach for an annotation a real static analyzer enforces. Drift produces a tool error, not just an agent surprise.

| Language | Tool | Real annotations |
|----------|------|------------------|
| PHP | Psalm | `@psalm-assert`, `@psalm-pure`, `@psalm-immutable`, `@psalm-mutation-free` |
| PHP | PHPStan | `@phpstan-assert`, `@phpstan-pure`, generic types |
| TypeScript | tsc + ESLint | branded types, `eslint-plugin-functional` for purity, `assert_never` |
| Python | mypy / pyright | `assert_type`, `TypeGuard`, `TypeIs`, `Never`, `@final` |

### 3. Formal contract for the residual

For properties no checker can express — algebraic laws, multi-step protocol invariants, invariants over external state — leave a contract in the host language's native comment syntax with Unicode + ASCII gloss.

Annotation forms:

- `@requires <precondition>` — must hold of inputs at call time
- `@ensures <postcondition>` — guaranteed of result / observable state
- `@invariant <property>` — holds at loop head, between method calls, across state transitions
- `@trusted <param>` — value inlined into a security-sensitive sink; origin must be trusted code, never user input
- `@pure` / `@mutates X` / `@throws Y` / `@io` — effect declaration
- `@property <law>` — algebraic law (idempotence, associativity, commutativity, monotonicity)
- `@time <bound>` / `@space <bound>` — asymptotic complexity. Use `Θ(...)` for tight bound, `O(...)` for upper bound only, `Ω(...)` for lower bound. Most contracts write `O(...)`; SHOULD prefer `Θ(...)` when the bound is actually tight, because `O(n²)` is technically true of an `O(n)` function and that looseness primes the wrong reasoning.

See `vocabulary.md` for the clause-first derivation table (clause shape → encoding tier), the full glyph palette, and the complexity-notation glossary.

## Style rule — form is the activation

The form MUST match formal-language conventions. Informal prose does not switch the reasoning mode. Four tiers, with the strongest pairing Unicode formal + assumption-naming gloss:

- ✗ informal English: `// always positive` — neither activation nor assumptions
- ✗ ASCII formal alone: `@ensures result >= 0` — weak priming, no assumption-naming
- ◐ Unicode formal + translation gloss: `@ensures result ≥ 0  // result >= 0` — primes the formal surface, gloss is redundant translation
- ✓ Unicode formal + assumption-naming gloss: `@ensures result ≥ 0  // result is non-negative; overflow is caller's responsibility` — primes high-bandwidth readers AND gives low-bandwidth readers the same content as prose with assumptions explicit

The shape signals "this is a function to reason about formally," not "this is a function to skim and pattern-match." The gloss makes the contract robust across reader capacities.

## Semantic-ambiguity second pass

After writing range and type constraints, ask: **does any constant or sentinel in this function carry more than one meaning?**

Formal annotations bias toward easy formal targets — range, type, sign. They miss *semantic overloading*: a single value standing for two distinct domain states. The blind spot is structural — `@requires x ≥ 0` cannot express "and `0` is distinct from `null`."

Common patterns to flag:

- `value ?? 0` (or `?? ""`, `?? -1`) where the coalesced-from value and the coalesced-to value carry different meanings downstream
- Sentinel integers (`-1` for "not found", `999` for "all", `0` for "default")
- Empty string vs missing string
- `0` returned from a counter that also legitimately returns `0`

When you find one, lift the sentinel into the type — `null | { kind: 'loaded'; price: PositiveAmount } | { kind: 'call-for-price' }` — so the two states are unrepresentable as the same value. Then the formal annotation regains coverage.

### Real example

`@simpleapps-com/augur-utils` `derive-price.ts` was written with the contract treatment, including a self-aware note about IEEE-754 vs ℝ. It still missed this exact blind spot:

```ts
const unitPrice = priceData.unitPrice ?? 0;  // null collapses to 0
isCallForPrice: unitPrice === 0,             // 0 means "call for price"
```

The contract correctly enforces `unitPrice ≥ 0 ∧ Number.isFinite(unitPrice)` — but cannot say "and `null` is distinct from `0`," because `null` was already coalesced away. The fix is to handle `priceData.unitPrice === null` *before* the coalesce, lifting the two states into the type.

## Drift is a defect — not a sync target

If the code contradicts an annotation, that is a bug. MUST decide which is wrong and fix it. MUST NOT silently rewrite the annotation to match incorrect code.

Unenforced annotations that drift do active harm — they prime future agents toward the wrong invariant. A wrong contract is worse than no contract.

When you find drift while editing:

1. Read the contract carefully
2. Read the code carefully
3. Decide which one captures the intended behavior — look at call sites, tests, related code
4. Fix whichever is wrong
5. If you cannot tell which is intended, MUST stop and ask the user. MUST NOT guess.

### Tautological postconditions

A related anti-pattern: postconditions that mirror the constructor. `@ensures result.kind === 'loaded'` on `function loaded(item) { return { kind: 'loaded', item } }` adds nothing — the constructor already guarantees it. Useful postconditions assert properties the *reader of the call* would not derive from the constructor alone (algebraic laws, conservation invariants, observable state changes). Restating the constructor adds bookkeeping without adding reasoning, and is a sign the contract was back-fitted rather than written clause-first.

## Why mechanism #1 works (priming hypothesis)

LLM behavior is conditional on context shape. Models trained on verified-language corpora develop latent circuits for spec-then-implementation reasoning. Native-syntax contracts in the F\*/Lean/Dafny shape *plausibly* activate those circuits during code generation, review, and refactoring — even though the host language has no formal semantics.

**Rarity is the activation.** The Unicode glyphs (∀, ∃, ⟨⟩, ↦, ⊑, ≥, ≤, ≠, ⇒, ∧, ∨, ¬, ℕ, ℝ, ∈, ∉) co-occur in training data with theorem-prover output, type-theory papers, and formal-methods source. Sampling tokens with those glyphs pulls hidden state toward that neighborhood. ASCII transliterations (`forall`, `>=`, `=>`) live in commoner code-review text — for AI priming, that familiarity dampens the shift.

The asymmetry: if the priming hypothesis works, as proof-trained model capability improves over time, annotations added today retroactively become more valuable. Zero extra work from the developer; the priming benefit grows with each model upgrade.

## Why mechanism #2 works (test surfacing)

Distinct from priming. **Observed in practice:** when a function carries explicit clauses, the agent generates *new and better tests* on subsequent edits — tests it would not have surfaced reading the implementation alone.

Contracts make intent legible. Each clause is an oracle for at least one test class:

- Each `@requires` → input-boundary tests (`q < 0`, `q = 0`, `q = NaN`)
- Each `@ensures` → property to assert on the output
- Each `@invariant` → multi-step test (call sequence, then check invariant)
- Each `@trusted` → fuzz-test target on untrusted inputs
- Each `@time O(...)` → scaling benchmark (assert the bound holds at n=10, n=100, n=1000)
- Each `@space O(...)` → memory-stability test (assert the bound holds across input sizes)
- Clauses also expose edge cases by negation: `@requires q ≥ 0` makes the agent ask "what about q < 0? what about NaN?"

Without the contract, the agent has only the function body to inspect — and the body rarely announces its boundaries explicitly. With the contract, every clause is a test-case oracle. This effect is observable session-by-session — test count, edge-case coverage, mutation-test kill rate.

### Close cousin: improvement-opportunity surfacing

The same legibility that surfaces tests also surfaces *improvement opportunities*. A function annotated `@time O(n²)` invites the agent reading it to ask "can this be improved to `O(n log n)`?" The complexity contract makes the target visible. Without it, the agent maintains the function as written; with it, the agent has an explicit invariant to question. Same mechanism (legible intent → visible gap), different output (refactor candidates instead of test cases).

This is why complexity contracts are not just documentation. A function honestly labeled `@time O(n²)` and called from a hot loop is a refactor target the agent will surface on the next read.

## Why mechanism #3 works (agent-reported value)

Agents themselves report, in active session use, that the contract content adds useful context for complex / load-bearing methods. The cost of carrying contracts in the context window is paid back in usefulness, not just consumed. Qualitative confirmation, but real-world signal that the practice pays off in routine session work.

## Evidence and falsifiability

Mechanism #1 is **plausible but not directly measured for in-source contracts**. Cite-able adjacent evidence:

- **ContractEval** (arXiv 2510.12047) — LLM contract-satisfaction rises from 0% (vanilla) to ~50% when contracts are stated in the prompt. Demonstrates the mechanism works for *prompt-supplied* contracts.
- **Specification-Guided Repair of Dafny Programs with LLMs** (arXiv 2507.03659) — LLMs reason measurably better when Dafny pre/postconditions are present.
- **Type-Constrained Code Generation** (arXiv 2504.09246) — type annotations cut hallucinated APIs and compilation errors >50%. Supports "tighten the type system first."
- **CoT mech-interp** (arXiv 2402.18312, arXiv 2507.22928) — surface cues like "let's think step by step" route through identifiable internal circuits in larger models. Supports "surface form conditions reasoning mode."

**Falsifiable prediction:** annotating a load-bearing function with these contracts produces, on the next agent edit, fewer correctness regressions and/or more rigorous reasoning traces than the same function un-annotated.

**Practical signals before the formal experiment runs:**

- Test-count / edge-case-coverage / mutation-kill-rate delta between Unicode-bearing and ASCII-bearing contracts on equivalent functions (mechanism #2; observable session-by-session)
- Fewer correctness regressions in functions carrying contract annotations (mechanism #1; quarter-scale)
- Fewer "oops, missed the case where X" follow-up commits to annotated functions
- Agent feedback on whether the contracts are pulling weight in their reasoning (mechanism #3; per-session)

If signals trend the wrong way over a quarter of usage, the bet has not paid off and the skill SHOULD be downgraded or removed.

Until then, treat this skill as a defensible bet across three independent mechanisms.

## See also

- **`vocabulary.md`** — full Unicode glyph palette, ASCII gloss patterns, clause-first derivation table, per-language examples
- **`audit.md`** — the audit modes (per-file + session-aware), invoked by `/contract-audit`
- **`apply.md`** — six-phase loop (Orient → Read → Draft → Trim → Discover → Verify) for adding contracts to existing code
