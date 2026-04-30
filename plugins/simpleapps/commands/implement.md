---
name: implement
description: Execute an implementation plan from a WIP file or session context. Work autonomously, document what was done.
argument-hint: "[wip/GH30-slug.md]"
allowed-tools: Bash(git -C:*), Bash(pnpm:*), Bash(npm:*), Bash(npx:*), Bash(python:*), Bash(pip:*), Bash(composer:*), Bash(php:*), Bash(rm:*), Bash(date:*), Skill(wiki), Skill(project-defaults), Skill(github), Skill(git-safety), Skill(bash-simplicity), Skill(writing-style), Skill(wip), Skill(work-habits), Skill(code-contracts), Read, Write, Glob, Grep, Edit, Agent
---

First, use Skill("wiki") to load project context, then Skill("project-defaults") for layout, then Skill("git-safety") for git guardrails, then Skill("bash-simplicity") for Bash conventions, then Skill("writing-style") for variable naming and code style standards, then Skill("wip") for the WIP frontmatter schema, then Skill("work-habits") for autonomous execution rules and RFC 2119 compliance, then Skill("code-contracts") for the formal-contract discipline on load-bearing code (apply only when scope is load-bearing per the skill's "When to use it" section — money math, auth, concurrency, state machines, security boundaries, non-trivial algorithms).

Execute an implementation plan. Work autonomously. Only stop for user input when stuck or when a decision has no clear answer.

**Scope: implementation means code changes only.** Write code, edit files, run build/test commands. Do NOT commit, create branches, or open PRs. Those are separate actions the user will request when ready. When done, report what changed and stop.

## 0. Branch setup

Branch management is the agent's job, not the user's. **Encourage** clean main, do not force it. Nudge the user, do the safe transition yourself, and keep moving. The only pause condition is a dirty tree.

1. Resolve the issue number `N` from the WIP being implemented (filename like `wip/GH367-…md` → `N=367`)
2. Run `git -C repo branch --show-current` → branch `B`
3. Run `git -C repo status --porcelain` → tree state `T`

Decision matrix:

| `B` | `T` | Action |
|-----|-----|--------|
| Contains `N` (e.g., `feat/N-slug`) | any | Proceed — continuing in-flight work for this issue |
| `main` / `master` | clean | Create the branch yourself: `git -C repo switch -c <type>/<N>-<slug>`, then proceed. Derive `<type>` from the issue title prefix (`feat:` → `feat`, `fix:` → `fix`, `chore:` → `chore`, `docs:` → `docs`, etc.). Derive `<slug>` from the issue title (lowercase, hyphenated, ≤40 chars). |
| Different issue branch (`feat/M-…` where `M ≠ N`) | clean | Nudge: tell the user you're switching off `<branch>` to main. Run `git -C repo switch main`, create the new branch, and proceed. The user's prior work is already committed on `M`'s branch and can be resumed later. |
| any | dirty | **Pause and ask once.** Uncommitted work would be mixed or lost. Surface the modified files, propose one path (commit on a branch, stash, discard), and let the user choose. Proceed on their answer. Do NOT touch their changes without instruction. |

The only pause condition is a dirty tree, because proceeding could destroy work the agent didn't make. Clean state — even on someone else's feature branch — is never a stop; transition and continue.

## 1. Determine the plan

### With a WIP file

If `$ARGUMENTS` is provided, read it directly as a relative path.

If no argument, use Glob to check `wip/*.md` for WIP files. If one exists, use it. If multiple exist, list them and ask which to implement.

If a WIP is found, check that Research, Analysis, and Files to modify are populated. If they're empty, tell the user the WIP isn't ready and suggest `/investigate` and `/discuss` first.

### Without a WIP file

If no WIP files exist, use the current session context as the plan: what was discussed, agreed, and decided in conversation. Summarize your understanding of what needs to be built and confirm with the user before proceeding.

## 2. Load context

1. Read the wiki for project conventions and patterns
2. If using a WIP, read every file listed in the "Files to modify" table
3. **Check for subsystem docs.** For each code path you are about to change, use Glob to look for a colocated `README.md` or similar at the subsystem level (e.g., `repo/src/helpers/README.md`), and any per-item detail doc next to the specific thing you are editing. Read them before touching code. They carry intent, invariants, and prior decisions that the code alone does not. See `simpleapps:wiki` "Progressive Disclosure via Colocated Markdown" for the pattern. These docs MUST be kept current with your changes per `simpleapps:work-habits` "Leave it better than you found it."
4. If using session context, explore the relevant codebase areas to understand current state
5. Review the approach, alternatives, and risks (from WIP Analysis or session discussion)

## 3. Execute the plan

Work through the implementation. For each change:

1. Read the file (if not already in context)
2. Make the changes described in the WIP
3. Verify the change makes sense in the context of surrounding code

### Autonomy rules

- **Keep going**: do not stop after each file to ask for confirmation
- **Make decisions**: if the implementation requires minor decisions not covered in the WIP (variable names, exact placement, etc.), make them and document in the WIP
- **Discover additional changes**: if a change requires modifying files not in the plan, make the change and add the file to the "Files to modify" table
- **Stop when stuck**: if you hit a problem with no clear solution, stop and ask the user. Explain what you tried and what's blocking you
- **Stop for scope questions**: if the implementation reveals the scope is larger than expected, stop and discuss with the user before continuing

## 4. Document the implementation

If a WIP file was used, update it. If no WIP exists, create an implementation record at `wip/impl-{slug}.md` with the same structure (including frontmatter per `simpleapps:wip`). This ensures every implementation has an audit trail.

### Frontmatter

Per `simpleapps:wip`, set `status: in-progress`, bump `last_reviewed` to today (`date +%Y-%m-%d`), and set `branch` to the current branch name if not already set (`git -C repo branch --show-current`). Do NOT set `status: shipped` here — that belongs to `/submit` after the push + CI green.

If the file has no frontmatter (legacy), add the full block per the schema before editing sections.

### Implementation section

Add an **Implementation** section (after Analysis, before Files to modify):

```markdown
## Implementation

### Changes made
- `path/to/file.ts`: description of what was actually changed and why
- `path/to/other.ts`: description of changes

### Assumptions
- List any assumptions made during implementation
- Include reasoning for decisions not covered in the original plan

### Deviations from plan
- Any changes that differed from the original "Files to modify" plan
- Additional files that needed modification
- Approaches that changed during implementation and why

### Open questions
- Anything that needs follow-up or user review
```

Update the "Files to modify" table to reflect what was actually changed (add new rows for files discovered during implementation).

Leave frontmatter `status: in-progress` at this point. `/submit` is responsible for flipping to `shipped` once the work lands and CI is green.

## 5. Report and stop

Tell the user:
- What was implemented (brief summary)
- Files changed (count and list)
- Any assumptions or deviations from the plan
- Any open questions
- Suggest next step: `/quality` to run checks, then `/verify` to confirm in the browser
- Remind that the WIP has full implementation details for review

**Then stop.** Do not commit, push, create PRs, or suggest doing so. The user decides when and how to package the changes.
