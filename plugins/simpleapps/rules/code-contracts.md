# Code Contracts

When editing or auditing **load-bearing code** (money math, auth, concurrency, state machines, security boundaries, non-trivial algorithms — the 5-10% where a subtle bug compounds), SHOULD add formal contracts (`@requires`, `@ensures`, `@invariant`, `@trusted`, `@time`, `@space`) in the host language's native comment syntax. Each clause carries two surfaces on the same line: a Unicode formal surface (∀, ∈, ≥, ℕ, Θ, Ω) for readers with bandwidth to parse it, and a prose gloss that **names assumptions** (not just translates symbols) for readers without that bandwidth. Prefer `Θ(...)` over `O(...)` when the complexity bound is tight.

MUST NOT apply by default to glue code, getters/setters, UI components, plumbing, test bodies, or one-off scripts. Annotation density has a context-window cost; concentrate where rigorous reasoning matters.

Drift between contract and code is a defect. MUST decide which is wrong and fix it. MUST NOT silently rewrite the contract to match incorrect code.

Load Skill("code-contracts") for full conventions, the glyph palette, audit modes, and the six-phase loop for adding contracts to existing code.
