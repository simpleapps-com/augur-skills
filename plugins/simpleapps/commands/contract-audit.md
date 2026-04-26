---
name: contract-audit
description: Audit code for missing or weak formal contracts on load-bearing functions. With no args, scans files read or written this session. With a path, audits that file in depth.
argument-hint: "[file path] (omit for session-aware mode)"
allowed-tools: Read, Glob, Skill(code-contracts), Skill(bash-simplicity)
---

First, use `Skill("code-contracts")` to load the contract-writing core, then read `${CLAUDE_SKILL_DIR}/../skills/code-contracts/audit.md` for the audit-mode instructions.

# Contract Audit

Two modes — pick by argument:

## Mode selection

- **No argument** → run **session-aware mode**. Scan files read or written in the current session, score each for load-bearing-ness and existing contracts, produce a ranked report of contract candidates.
- **One argument (a path)** → run **per-file mode**. Audit the file at the given path through the four audit questions; produce contracts and a test-gap report.

The detailed instructions for both modes live in `code-contracts/audit.md` (loaded via the skill). This command is the entry point that selects the mode and renders the report.

## Output is a report, not a code change

The audit MUST produce a markdown report. MUST NOT auto-apply contracts, modify code, or write tests. The human reviews the report and decides what to act on. See `code-contracts/audit.md` § "Output format" for the report structure.

If a finding warrants applying contracts to a specific function, point the user at `apply.md` (the six-phase loop) — running that loop is a separate task.

## When NOT to annotate

The audit report MUST include the "When NOT to annotate" section before per-section findings. Pure transforms whose contract is fully expressed by the type signature, test files, generated code, glue/plumbing, and one-off scripts MUST NOT be annotated. Without this guardrail the audit produces JSDoc bloat instead of signal. See `code-contracts/audit.md` § "When NOT to annotate" for the full skip list.

## Session-aware mode rules

- Filter the candidate set to source files in `repo/` (skip tests, configs, generated)
- Score each candidate using session context (the agent has been in the file's context — use that)
- Output a ranked list with one-line rationales, not a deep dive per file
- The user picks the top item and runs `/contract-audit <path>` to do the per-file deep dive

## Per-file mode rules

Walk the four audit questions in order:

1. Where do types not capture a runtime constraint?
2. Does the function's name and docstring match its actual behavior?
3. Does this file produce values consumed elsewhere with implicit contracts? (Highest-value finding — cross-file trust boundaries.)
4. For each contract this audit produces, what tests does the contract demand that the suite does not yet have?

See `code-contracts/audit.md` for full per-question guidance and the report format.
