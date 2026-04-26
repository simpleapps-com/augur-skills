# Code Contracts — Vocabulary Reference

The full glyph palette, ASCII gloss patterns, clause-first derivation table, and per-language examples. Loaded by `SKILL.md` on demand.

## Glyph palette

A small, opinionated set. MUST stay narrow — each glyph the agent emits should be one a reader has seen elsewhere in this codebase, not a novelty.

| Family | Glyphs | ASCII gloss |
|--------|--------|-------------|
| Logic | `∀`, `∃`, `∧`, `∨`, `¬`, `⇒`, `⇔` | forall, exists, and, or, not, implies, iff |
| Comparison | `≤`, `≥`, `≠`, `≡`, `≜` | <=, >=, !=, ==, := (definition) |
| Sets | `∈`, `∉`, `⊆`, `⊂`, `∪`, `∩`, `∅` | in, not in, subset of, proper subset, union, intersection, empty |
| Numbers | `ℕ`, `ℤ`, `ℚ`, `ℝ` | natural, integer, rational, real |
| Functions | `→`, `↦`, `∘` | function-of, mapsto, compose |
| Brackets | `⟨ ⟩`, `⟦ ⟧` | tuple, denotation |
| Complexity | `Θ`, `O`, `Ω`, `ω`, `~`, superscripts (`²`, `³`, `ⁿ`) | tight bound, upper bound, lower bound, strictly lower, asymptotic equivalence, exponentiation |
| Limits | `→ ∞`, `lim` | "as n grows without bound" |

### What stays ASCII

- Tag prefixes (`@requires`, `@ensures`, `@invariant`, `@trusted`, `@pure`) — for tooling compatibility (Psalm, PHPStan, JSDoc tooling, mypy, pyright)
- Operators inside type signatures (TS/PHP/Python syntax — `&`, `|`, `:`, `?`, etc.)
- Inline gloss text on every clause (the dual-audience pattern)

Unicode lives inside the *clause body*. ASCII gloss lives on the same or next line.

### Common glyph confusions to avoid

- `⇒` (implication) vs `→` (function arrow) vs `↦` (mapsto). Use `⇒` for logical implication, `→` for "function from A to B," `↦` for "x mapsto f(x)."
- `≡` (logical equivalence / equal-by-definition in some traditions) vs `≜` (definition). Prefer `≜` for definitions, `≡` for "same up to" relations.
- `⊆` (subset-or-equal) vs `⊂` (proper subset). Most contract uses want `⊆`.
- `Θ(f)` (tight bound) vs `O(f)` (upper bound only) vs `Ω(f)` (lower bound). Most code calling itself "O(n log n)" is actually `Θ(n log n)` — the bound is tight, not just an upper limit. SHOULD use `Θ` when the bound is tight; `O` is correct only when the function may run *faster* than f. Loose `O` claims prime the wrong reasoning ("this is at most O(n²)" when the agent should think "this is exactly Θ(n log n)").

## Pairing patterns

Pick one and apply consistently within a file. **The gloss MUST carry assumption-naming, not just translation** (see `SKILL.md` § "Two surfaces per clause"). The Unicode formal surface activates careful reasoning in readers with bandwidth to parse it; the prose gloss carries the same content for readers without that bandwidth, plus the assumptions the formal notation cannot express.

### Pattern A — inline assumption-naming gloss after the formal clause

```ts
@requires q ≥ 0           // q is non-negative; assumes caller validated input
@ensures  result ∈ ℕ       // result is a natural number; overflow is caller's responsibility
```

Denser. Reads as a column of formal clauses with the prose-and-assumptions as a sidebar.

### Pattern B — bracketed gloss on the same line

```ts
@requires q ≥ 0  (q is non-negative; assumes caller validated input)
@ensures  ∀ x ∈ items. x.qty ≥ 0  (every item has non-negative qty; empty array is allowed)
```

Less dense. Reads more like prose. Better when the clauses are short and the assumption-naming is short.

### What the gloss is NOT

A redundant translation. `@requires q ≥ 0  // q >= 0` is the wrong gloss — both lines say the same thing, neither names what is assumed. The gloss MUST add at least one of:

- An assumption the formal notation does not express (no NaN, integer not float, validated upstream)
- A side condition (locking, transactional context, ordering)
- A boundary the contract treats as out-of-scope (overflow, empty input, sentinels)

If the gloss is exactly `@requires q ≥ 0  // q >= 0`, drop it — it's bookkeeping, not load-bearing prose.

## Clause-first derivation table

Write the clause first. The encoding falls out of the clause shape.

| Clause shape | Tier | Encoding |
|--------------|------|----------|
| Refinement: `q : ℕ ∧ q > 0`  *(q is a positive natural)* | 1 | Branded type + smart constructor: `type PositiveInt = number & { readonly __brand: 'PositiveInt' }; function mkPositive(n: number): PositiveInt` |
| Sum: `Status ≜ Loaded(Item) ∨ NotFound ∨ CallForPrice`  *(tagged union of three states)* | 1 | Discriminated union: `{ kind: 'loaded'; item: Item } \| { kind: 'not-found' } \| { kind: 'call-for-price' }` |
| Predicate: `∀ x ∈ xs. p(x)`  *(every x in xs satisfies p)* | 2 | `xs.every(p)` |
| Predicate: `∃ x ∈ xs. p(x)`  *(some x in xs satisfies p)* | 2 | `xs.some(p)` |
| Effect: `pure`, `mutates X`, `throws Y` | 2 | `@psalm-pure`, `@psalm-mutation-free`, `eslint-plugin-functional` |
| Otherwise (algebraic law, multi-step protocol invariant, external state) | 3 | Formal-prose annotation in JSDoc / docstring |

The discipline: write the clause **before** the function. Reversing the order — writing the function and back-fitting a contract — bypasses the cognitive work and produces tautological annotations.

## Per-language examples

### TypeScript

```ts
/**
 * Compute order total in cents.
 *
 * @requires items.length > 0          // at least one line item; empty cart is caller's responsibility
 * @requires ∀ i ∈ items. i.qty > 0     // every item has positive qty; assumes upstream validation
 * @ensures  result === Σ(items, i ↦ i.qty × i.unitPrice)
 *           // result is the sum of qty × unitPrice; assumes integer cents, no rounding here
 * @ensures  result ∈ ℕ                 // result is non-negative; overflow is caller's responsibility
 * @time     Θ(n)                       // linear in n = items.length
 * @space    O(1)                       // auxiliary space — accumulator only
 * @pure
 */
function totalCents(items: LineItem[]): number { ... }
```

### PHP

```php
/**
 * Rebuild the latest snapshot from the event log.
 *
 * @requires $events is sorted ascending by occurredAt
 *           (events are chronological; ordering is caller's responsibility, not validated here)
 *
 * @ensures  result ≜ fold($events, replay)
 *           (result is the snapshot replayable from the event log; assumes replay is deterministic)
 *
 * @invariant during fold, accumulator state ≡ replay($events[0..i])
 *            (at each step i, accumulator equals replay of events 0 through i; holds only if events are immutable during fold)
 *
 * @time     Θ(n)                              // linear fold over events; n = count($events)
 * @space    O(1)                              // running accumulator, no buffering of events
 * @pure
 *
 * Footgun: $events === ∅ vs $events === [genesis] are not the same precondition.
 *          (empty array means "no genesis"; caller must distinguish from "not yet bootstrapped")
 */
function rebuild(array $events): Snapshot { ... }
```

### Python

```python
def transfer(src: Account, dst: Account, cents: int) -> None:
    """
    Transfer cents from src to dst, atomically.

    @requires cents > 0                        # cents must be positive; zero-amount is caller's responsibility
    @requires src.balance ≥ cents              # sufficient funds; assumes balance was read inside the same lock
    @requires src ≠ dst                        # src and dst differ; self-transfer is caller's bug, not ours
    @ensures  src.balance ≡ old(src.balance) − cents
              # src.balance decreases by cents; assumes no concurrent mutators outside this lock
    @ensures  dst.balance ≡ old(dst.balance) + cents
              # dst.balance increases by cents; same locking assumption
    @invariant src.balance + dst.balance ≡ old(src.balance) + old(dst.balance)
               # total balance is conserved; holds across the atomic boundary, not mid-flight
    @time     Θ(1)                                # constant — three field updates
    @space    Θ(1)
    @mutates  src, dst
    """
```

## Annotation forms reference

- `@requires <precondition>` — must hold of inputs at call time
- `@ensures <postcondition>` — guaranteed of result / observable state
- `@invariant <property>` — holds at loop head, between method calls, across state transitions
- `@trusted <param>` — value inlined into a security-sensitive sink (SQL, HTML, shell); origin must be trusted code, never user input
- `@pure` — no observable effects (no mutation, no IO, no throws under normal inputs)
- `@mutates <state>` — names the state mutated (a parameter, a field, a global)
- `@throws <type>` — names the exceptions that may be raised
- `@io` — performs IO (filesystem, network, console)
- `@property <law>` — algebraic law the function satisfies (idempotence, commutativity, associativity, monotonicity)
- `@time <bound>` — runtime complexity. Use `Θ(...)` for tight bound, `O(...)` for upper bound only, `Ω(...)` for lower bound. Amortized: `@time Θ(1) amortized`. Worst/avg split: `@time worst Θ(n²)  avg Θ(n log n)`.
- `@space <bound>` — auxiliary space complexity (excluding input). Same `Θ`/`O`/`Ω` conventions.

## Glossary

A reader unfamiliar with the symbols can use this section. Over repeated exposure these become routine.

| Symbol | Reads as | Means |
|--------|----------|-------|
| `∀ x ∈ S. P(x)` | "for all x in S, P of x" | every element of S satisfies the predicate P |
| `∃ x ∈ S. P(x)` | "there exists x in S such that P of x" | at least one element of S satisfies P |
| `A ⇒ B` | "A implies B" | if A then B |
| `A ⇔ B` | "A iff B" | A holds exactly when B holds |
| `A ∧ B` | "A and B" | both A and B hold |
| `A ∨ B` | "A or B" | at least one of A, B holds |
| `¬A` | "not A" | A does not hold |
| `x ∈ S` | "x is in S" | x is an element of S |
| `S ⊆ T` | "S is a subset of T" | every element of S is in T |
| `S ∪ T` | "S union T" | elements in S or T (or both) |
| `S ∩ T` | "S intersect T" | elements in both S and T |
| `∅` | "empty" | the empty set or empty collection |
| `ℕ` | "naturals" | non-negative integers (0, 1, 2, …) |
| `ℤ` | "integers" | …, -1, 0, 1, … |
| `ℝ` | "reals" | the real numbers (note IEEE-754 ≠ ℝ) |
| `f : A → B` | "f from A to B" | f is a function from set A to set B |
| `x ↦ f(x)` | "x mapsto f of x" | the function that maps x to f(x) |
| `≜` | "is defined as" | left side is defined to mean the right |
| `≡` | "equivalent to" | the two are interchangeable in this context |
| `Σ(xs, f)` | "sum of f over xs" | sum of f(x) for each x in xs |
| `Θ(f(n))` | "Theta of f of n" | tight asymptotic bound — function grows exactly at the rate f(n) |
| `O(f(n))` | "Big-O of f of n" | upper bound only — function grows at most as fast as f(n) |
| `Ω(f(n))` | "Big-Omega of f of n" | lower bound — function grows at least as fast as f(n) |
| `ω(f(n))` | "little-omega of f of n" | strictly faster than f(n) |
| `f ~ g` | "f is asymptotic to g" | f(n)/g(n) → 1 as n → ∞ |
| `n → ∞` | "as n grows without bound" | the limiting case for asymptotic claims |

The glossary is intentionally short. Other symbols MAY be added when load-bearing across multiple files; bare additions for a single use SHOULD be avoided.
