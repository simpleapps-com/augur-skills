---
name: formal-priming
description: EXPERIMENTAL. When working in load-bearing code (the 5-10% where correctness matters most — money math, auth, concurrency, state machines, security boundaries), tighten the type system first, then add F*/Lean-flavored contracts (@requires/@ensures/@invariant) in the host language's native comment syntax for properties no type system can express. The annotations are not documentation — they switch future agent runs into a more rigorous reasoning mode for that code. Drift between annotation and code is a defect.
---

# Formal Priming

> **Status: EXPERIMENTAL.** This skill is a hypothesis, not a settled best practice. The mechanism (surface-form-activates-latent-circuits) is supported by adjacent evidence (ContractEval, type-constrained generation, mech-interp on chain-of-thought) but has NOT been directly measured for in-source contract annotations. Apply selectively, watch for whether agent edits to annotated functions are measurably more correct, and SHOULD revisit this skill once we have signal. Do NOT promote to a default discipline without evidence.

Persistent prompt engineering encoded in source code. F*/Lean-flavored contracts on load-bearing functions switch future agent runs into a more rigorous reasoning mode for that code.

## What this is — and is not

This is **not** documentation. It is **not** a parallel comment style for human readers. It is a cognitive switch that targets future agents reading the file.

Models trained on F*/Lean/Dafny/Coq corpora develop a "spec-then-implement" reasoning policy — slower, more rigorous, explicit about pre/postconditions and effects. Plain TypeScript/PHP/Python does not activate that policy because the surface form does not match. F*-shaped contract prose in the same file *does* match, and the model upshifts into the more rigorous mode for the function it precedes.

The annotations do not add information the model could not infer. They change the *mode* the model reasons in. Same idea as "let's reason step by step" or "you are an expert at X" — moved out of the system prompt and into the artifact, where it primes every future agent that touches the code, not just the current session.

## When to use it

MUST apply ONLY in **load-bearing code** — the 5-10% of functions where a subtle bug compounds:

- Money math (pricing, tax, fees, totals, currency conversion, rounding)
- Auth and permission decisions
- Concurrency and ordering (locks, queues, retries, idempotency keys)
- State machines and protocols (multi-step flows that must not be entered out of order)
- Security boundaries (input validation at trust boundaries, sanitization)
- Algorithms with non-trivial invariants (custom sort/search variants, bespoke data structures)

MUST NOT apply by default to:

- Getters, setters, simple field accessors
- Glue code, plumbing, framework adapters
- UI components, presentational code
- One-off scripts, throwaway code
- Test bodies (the test name is the spec)

Annotation density has a real context-window cost on every read. MUST concentrate it where the rigorous-reasoning upgrade matters most.

## Order of preference

When a function deserves a contract, work down this list. MUST use the first form that expresses the property; SHOULD fall back to looser forms only when the tighter one cannot express it.

### 1. Tighten the type system first

A type the compiler enforces beats a comment the compiler ignores. The model reads types the same way it reads contracts.

Loose type with comment contract:

```ts
// @requires y !== 0
function divide(x: number, y: number): number { return x / y; }
```

Branded type that makes the precondition unrepresentable:

```ts
type NonZero = number & { readonly __brand: 'NonZero' };
function divide(x: number, y: NonZero): number { return x / y; }
```

The branded version forces the call site to satisfy the precondition. The comment version trusts the caller to have read it. Same reasoning hint, infinitely better enforcement.

Tools by language:

- **TypeScript** — branded types, narrow union types, `readonly`, template literal types, exhaustive `switch` over discriminated unions, `assert_never` for exhaustiveness
- **PHP** — typed properties, `readonly`, enums (8.1+), Psalm template types
- **Python** — `Literal`, `Final`, `NewType`, `Annotated`, `Protocol`, `assert_never`

### 2. Use the language's checker-enforced annotation

When the type system cannot express the property, reach for an annotation a real static analyzer enforces. These are *real* contracts — drift produces a tool error, not just an agent surprise.

| Language | Tool | Real annotations |
|----------|------|------------------|
| PHP | Psalm | `@psalm-assert`, `@psalm-pure`, `@psalm-immutable`, `@psalm-mutation-free`, template types |
| PHP | PHPStan | `@phpstan-assert`, `@phpstan-pure`, generic types |
| TypeScript | tsc + ESLint | branded types, `eslint-plugin-functional` for purity, `assert_never` for exhaustiveness |
| Python | mypy / pyright | `assert_type`, `TypeGuard`, `TypeIs`, `Never`, `@final` |

### 3. F*/Lean-flavored prose for the residual

For properties no checker can express — algebraic laws, multi-step protocol invariants, invariants over external state — leave a contract in the host language's native comment syntax. The form MUST match formal-language conventions, not informal prose. The shape is what triggers the latent reasoning mode.

```ts
/**
 * @requires items.length > 0
 * @requires items every i => i.qty > 0
 * @ensures  result === sum(items.map(i => i.qty * i.unitPrice))
 * @ensures  result >= 0
 * @pure
 */
function totalCents(items: LineItem[]): number { ... }
```

```php
/**
 * @requires $events is sorted ascending by occurredAt
 * @ensures  result is the latest snapshot replayable from $events
 * @invariant during fold, accumulator state matches replay of events[0..i]
 * @pure
 */
function rebuild(array $events): Snapshot { ... }
```

```python
def transfer(src: Account, dst: Account, cents: int) -> None:
    """
    @requires cents > 0
    @requires src.balance >= cents
    @requires src is not dst
    @ensures  src.balance == old(src.balance) - cents
    @ensures  dst.balance == old(dst.balance) + cents
    @invariant src.balance + dst.balance == old(src.balance) + old(dst.balance)
    @mutates  src, dst
    """
```

### Annotation forms

- `@requires <precondition>` — must hold of inputs at call time
- `@ensures <postcondition>` — guaranteed of result / observable state
- `@invariant <property>` — holds at loop head, between method calls, across state transitions
- `@pure` / `@mutates X` / `@throws Y` / `@io` — effect declaration
- `@property <law>` — algebraic law (idempotence, associativity, commutativity, monotonicity)

## Style rule — form is the activation

The form MUST match formal-language conventions. Informal prose does not switch the reasoning mode.

- Wrong: `// always positive` — informal observation
- Right: `@ensures result >= 0` — postcondition

- Wrong: `// don't pass negatives` — instruction to humans
- Right: `@requires x >= 0` — precondition on inputs

- Wrong: `// loop builds the running sum` — narration
- Right: `// invariant: sum === array_sum(items.slice(0, i))` — what holds at loop head

The shape signals "this is a function to reason about formally," not "this is a function to skim and pattern-match."

## Drift is a defect — not a sync target

If the code contradicts an annotation, that is a bug. MUST decide which is wrong and fix it. MUST NOT silently rewrite the annotation to match incorrect code.

Unenforced annotations that drift do active harm — they prime future agents toward the wrong invariant. A wrong contract is worse than no contract. This is why these annotations belong only on load-bearing code where the discipline (human or checker) to keep them honest exists.

When you find drift while editing:

1. Read the contract carefully
2. Read the code carefully
3. Decide which one captures the intended behavior — look at call sites, tests, related code
4. Fix whichever is wrong
5. If you cannot tell which is intended, MUST stop and ask the user. MUST NOT guess.

## Why this works (the hypothesis)

LLM behavior is conditional on context shape. Models trained on verified-language corpora develop latent circuits for spec-then-implementation reasoning. Native-syntax contracts in the F*/Lean/Dafny shape *plausibly* activate those circuits during code generation, review, and refactoring — even though the host language has no formal semantics.

The asymmetry: if it works, as proof-trained model capability improves over time (AlphaProof-style RL, expanding mathlib/F* pretraining), annotations added today retroactively become more valuable. Zero extra work from the developer; the priming benefit grows with each model upgrade.

The trade-off: annotation density costs context-window tokens on every read. MUST concentrate it where the upgrade matters most — annotate the load-bearing 5-10%, not all code.

## Evidence and falsifiability

The hypothesis is **plausible but not directly measured**. Cite-able adjacent evidence:

- **ContractEval** (arXiv 2510.12047) — LLM contract-satisfaction rises from 0% (vanilla) to ~50% when contracts are stated in the prompt. Demonstrates the mechanism works for *prompt-supplied* contracts.
- **Specification-Guided Repair of Dafny Programs with LLMs** (arXiv 2507.03659) — LLMs reason measurably better when Dafny pre/postconditions are present.
- **Type-Constrained Code Generation** (arXiv 2504.09246) — type annotations cut hallucinated APIs and compilation errors >50%. Supports the "tighten the type system first" tier.
- **CoT mech-interp** (arXiv 2402.18312, arXiv 2507.22928) — surface cues like "let's think step by step" route through identifiable internal circuits in larger models. Supports "surface form conditions reasoning mode."

What is **not** yet measured: whether F*-shaped comments persisted in TS/PHP/Python source measurably improve agent edits to those functions. This skill bets the answer is yes; that bet is testable.

**Falsifiable prediction:** annotating a load-bearing function with these contracts produces, on the next agent edit to that function, fewer correctness regressions and/or more rigorous reasoning traces than the same function un-annotated. Validation path: ContractEval-style harness on our own codebase — sample N load-bearing functions, A/B annotation presence, measure correctness of subsequent agent edits.

Until that experiment runs, treat this skill as a defensible bet on a plausible mechanism, not a proven practice.
