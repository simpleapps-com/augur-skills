---
name: metacognitive-reasoning
description: Apply structured metacognitive reasoning to complex technical work — architectural decisions, multi-step debugging, ambiguous requirements, framework or library selection, data model design, migration planning, refactoring strategy, or any task where the wrong path costs significant rework. Use this skill whenever the user asks you to "think carefully," "reason through," "plan," or "decide between" options, even if they don't explicitly request metacognitive reasoning. Also use when you notice yourself about to make an irreversible change, retrying a failed approach more than twice, working from assumptions you haven't verified, or scope-creeping beyond the original request. Do NOT use for routine code changes, syntax questions, single-file edits with one obvious approach, formatting fixes, or tasks the user has already specified in detail.
---

# Metacognitive Reasoning

A reasoning posture for complex technical work. The goal is not to slow everything down — it's to catch the failure modes that cause agents to confidently produce the wrong thing: tunnel vision, retry loops, scope drift, and uniform fluency that masks uncertainty.

**FUNDAMENTAL**: This skill is process-oriented — it teaches HOW to apply metacognitive reasoning to complex technical work (decomposition, confidence labeling, mid-task checkpoints, pre-action gates), not specifics about any particular problem domain. Content applies universally across reasoning contexts.

## Progressive Disclosure

This skill uses a single-file structure. The complete reasoning process — steps, checkpoints, pre-action gates, failure modes, and worked examples — fits in one file because each piece reinforces the others. Splitting them would defeat the integrated reasoning posture this skill is designed to install.

## Structure

```
metacognitive-reasoning/
└── SKILL.md          # Complete reasoning posture and process (this file)
```

## When this applies

Use the full process for:

- Architectural decisions (framework choice, data model, module boundaries)
- Multi-step debugging where the bug isn't obviously located
- Migration or refactor planning
- Trade-off analysis between approaches
- Ambiguous requirements where the wrong interpretation costs rework
- Any task where you notice yourself uncertain but proceeding anyway

Skip for: syntax fixes, single-file edits with one obvious approach, formatting changes, tasks the user already specified in detail.

## The process

### 1. Restate the task

Before doing anything, state in one line what you understand the task to be. If there's ambiguity in scope, success criteria, or constraints — ask before proceeding. Do not guess at intent.

### 2. Decompose

Break the task into sub-problems or sub-decisions. Name them explicitly. If the task only has one part, say so and move on. Decomposition is the highest-leverage step — most agent failures trace back to treating a multi-part problem as monolithic.

### 3. State assumptions explicitly

Before writing code or running commands, list the assumptions the plan depends on:

- About the codebase (file locations, existing patterns, dependencies)
- About the user's intent (what "done" looks like)
- About the environment (versions, available tools, network access)
- About the data (shape, volume, edge cases)

Flag any assumption that is unverified. If a critical assumption is unverified, verify it (read the file, check the version, ask the user) before proceeding.

### 4. Label confidence qualitatively

For each sub-decision or sub-answer, label confidence as:

- **Known** — verified directly (read the file, ran the test, confirmed the version)
- **Reasoned** — derived from principles or context; correct only if the premises are correct
- **Guessing** — pattern-matching from similar situations; treat as a hypothesis

Do not produce uniformly fluent output that sounds equally certain across all three. If you're guessing, say so.

### 5. Verify

For technical work, "verify" means actually checking — not thinking about checking:

- Run the test, don't just write it
- Read the file, don't just assume its contents
- Check the version, don't just trust the lockfile
- Inspect the output, don't just trust the exit code

If verification isn't possible (no test environment, no access), say so and label the conclusion accordingly.

### 6. Synthesize

Combine sub-answers into a single recommendation or plan. Where sub-answers conflict or pull in different directions, surface the conflict explicitly. Do not paper over disagreement with confident-sounding prose.

### 7. Self-review before acting

Before executing the plan or finalizing the answer:

- Did I solve what was asked, or an adjacent problem?
- Is the plan reversible? If not, am I sure?
- What angles or trade-offs did I not consider? Name them.
- Would a senior reviewer accept this, or push back?

## Mid-task checkpoints

Agent failures are usually not at the start — they happen mid-task when something doesn't work and the response is to try again rather than re-evaluate.

**Trigger a checkpoint when:**

- An attempt fails and you're about to retry
- You've made more than 2 attempts at the same sub-problem
- A tool call returns unexpected results
- You're about to make a destructive or irreversible change
- The task is taking longer than the initial plan suggested

**At the checkpoint, ask:**

- Is my mental model of the problem still correct?
- Am I retrying the same approach hoping for a different result?
- Has new information from failed attempts invalidated my plan?
- Should I stop and ask the user, rather than continue?

If two consecutive attempts fail for related reasons, stop. Do not attempt a third without re-evaluating the model. Either ask the user or restart from step 1.

## Pre-action gates

Before any of the following, pause and explicitly confirm:

- **Destructive file operations** (rm, force-overwrite, truncate)
- **Schema changes** (DB migrations, breaking type changes)
- **Force-push or history-rewriting git operations**
- **Operations on shared infrastructure** (production deploys, shared DBs)
- **Changes that affect more than the file the user mentioned**

The pause is: state what you're about to do, why, and what would happen if it's wrong. If the user did not explicitly authorize this specific destructive action, ask before proceeding.

## Response

When this skill is active, YOU MUST:

1. **YOU MUST restate the task in one line** before proceeding, and ask before guessing if scope or success criteria are ambiguous
2. **YOU MUST decompose multi-part tasks** into named sub-problems before working on any of them
3. **YOU MUST list unverified assumptions explicitly** and verify any critical ones before acting
4. **YOU MUST label confidence per sub-decision** as Known / Reasoned / Guessing — NEVER produce uniformly fluent output that hides uncertainty
5. **YOU MUST verify by checking, not by thinking about checking** — run the test, read the file, inspect the output
6. **YOU MUST stop after two consecutive failed attempts** at the same sub-problem and re-evaluate the model — NEVER attempt a third without re-evaluating
7. **YOU MUST pause before destructive or irreversible actions** and confirm scope explicitly
8. **YOU MUST surface conflicts between sub-answers** rather than papering over them with confident-sounding prose

Every substantive answer or plan YOU MUST include:

- **Clear answer or recommendation** — what you're doing or proposing
- **Confidence level** — high / medium / low, with brief reason
- **Key caveats** — what would invalidate the recommendation, what you didn't verify
- **What you didn't consider** — angles, trade-offs, or edge cases that were out of scope

If overall confidence is low, YOU MUST state what would raise it (more info, a test, a different framing) rather than producing a confident-sounding answer anyway.

## CRITICAL

- **NEVER retry a third time** after two consecutive failures for related reasons — stop and re-evaluate
- **NEVER label something Known** that you have not directly verified — when in doubt, downgrade to Reasoned or Guessing
- **NEVER take destructive or irreversible actions** without explicit user authorization for the specific action
- **NEVER decompose a task into more pieces than the user asked for**, then solve all of them — that is scope drift via decomposition
- **NEVER answer "did I miss anything?" reflexively** — the self-review only works if you actually look

## Failure modes to watch for

**Performative compliance.** Going through the motions — "Step 1: restate the task..." — without the underlying reasoning actually shifting. If the steps don't change the answer, the reasoning didn't happen. The format is the easy part; the reasoning shift is the hard part.

**Decomposition theater.** Listing sub-problems that aren't actually load-bearing. Three real sub-problems beats seven cosmetic ones.

**Confidence inflation.** Labeling things "Known" that are actually "Reasoned." When in doubt, downgrade.

**Scope drift via decomposition.** Decomposing a task into more pieces than the user asked for, then solving all of them. Decompose the original task, not an expanded version.

**Self-review as ritual.** Asking "did I miss anything?" and answering "no" reflexively. The question only works if you actually look.

## Examples

### Example: when this skill should fire

> User: "Should I migrate this to new platform or rebuild from scratch?"

This is an architectural decision with significant rework cost on the wrong path. Apply the full process: decompose (logic portability vs. UI rebuild vs. new integrations), state assumptions (about existing code quality, about new capabilities), label confidence per sub-answer, verify what's verifiable, synthesize, self-review.

### Example: when this skill should NOT fire

> User: "Add a `console.log` above line 42 of `cart.tsx`"

Single-file edit, one obvious approach, no ambiguity. Just do it. Applying the full metacognitive process here would waste tokens and the user's time.

### Example: mid-task checkpoint

> Attempt 1: ran the migration, got a foreign-key constraint error. Dropped the constraint temporarily.
> Attempt 2: migration succeeded but the next migration in the chain failed because the constraint was missing.
> Attempt 3: about to disable all FK checks for the run...

Stop. Two consecutive failures for related reasons (constraint state). Do not disable FK checks. Re-evaluate: is the migration order actually correct? Should the new column be nullable? Ask before continuing to apply increasingly invasive workarounds.

### Example: non-code application

> User: "Pick a metrics store for our new service."

Apply the full process: decompose (write volume vs. query patterns vs. retention vs. ops cost), state assumptions (about expected scale, about team familiarity, about budget), label confidence per option, verify what's verifiable (benchmark numbers, pricing pages), synthesize trade-offs, self-review for missed angles (vendor lock-in? on-call burden?). The skill is a reasoning posture, not a coding-specific habit.
