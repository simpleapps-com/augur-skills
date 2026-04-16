---
name: guide
description: Learn how we work. Workflow, available commands, skills, and conventions. Run this first if you're new to the project.
allowed-tools: Skill(workflow), Skill(project-defaults), Skill(github), Skill(writing-style), Skill(work-habits), Skill(conventional-commits), Skill(bash-simplicity), Skill(context-efficiency), Read, Glob
---

First, load these skills for context:
1. Skill("project-defaults"): directory layout and setup
2. Skill("workflow"): how work flows from Basecamp to GitHub
3. Skill("github"): GitHub conventions
4. Skill("writing-style"): writing standards
5. Skill("work-habits"): how to work autonomously
6. Skill("conventional-commits"): commit message format

Then explain the system to the user. Cover each section below in a clear, conversational way. Use examples. The reader is a developer who has never used this system before.

## 1. Project layout

Explain the directory structure from project-defaults. Emphasize:
- `repo/` is the git repo, `wiki/` is the wiki repo, `wip/` is for active tasks
- Use `git -C repo` from the project root
- Symlinks in `.claude/` connect to repo rules and commands

## 2. How work flows

Walk through the workflow skill's 6-step process:
1. Client request arrives in Basecamp
2. Read and understand it
3. Create a GitHub issue
4. Cross-link BC ↔ GH
5. Do the work
6. Report back via Basecamp

Explain the tool boundaries: Basecamp = client-facing, GitHub = developer-facing.

## 3. Available commands

Use Glob to find all `*.md` files in `repo/plugins/simpleapps/commands/`. For each file, Read with `limit: 12`. This captures the frontmatter (name, description, allowed-tools) without loading the full body, saving context. Present them in lifecycle order first, then supporting commands:

**Lifecycle** (in pipeline order):
`/triage` -> `/wip` -> `/investigate` -> `/discuss` -> `/implement` -> `/quality` -> `/sanity-check` -> `/verify` -> `/submit` -> `/deploy` -> `/publish`

**Supporting** (alphabetical):
`/audit-augur-packages`, `/commit-message`, `/context`, `/curate-wiki`, `/file-issue`, `/fyxer`, `/guide`, `/project-init`, `/research`, `/wiki`, `/wiki-audit`

For each command, show the name and its frontmatter description in a table.

## 4. Typical session

Walk through a concrete example:

```
/triage                          → see open issues and PRs
/wip https://basecamp.com/...   → scaffold WIP from client request
/investigate                     → explore codebase, update WIP with findings
                                 → review the analysis, start coding
/submit                          → commit and create a PR
/deploy                          → merge PRs and deploy to staging
/publish                         → version bump, tag, release to production
```

## 5. Available skills

Skills load reference material into context. They're loaded automatically by commands, but can also be loaded manually with `Skill("name")`.

Use Glob to find all `SKILL.md` files under `repo/plugins/simpleapps/skills/`. For each file, Read with `limit: 12`. This captures the frontmatter without loading the full body. Present them in a table, sorted alphabetically by name.

### Naming convention: skill, command, and rule may share a name

Several names exist as both a skill AND a command (and sometimes a rule too): `wiki`, `fyxer`, `quality`, `workflow`, `git-safety`. They are different things:

- **Skill**: reference material loaded into context (`Skill("wiki")` loads conventions)
- **Command**: a workflow you invoke (`/wiki` reads every wiki page into context)
- **Rule**: always-loaded one-liner that points to the skill (`rules/wiki-over-memory.md`)

When the user says "the wiki skill" they mean the conventions doc. "The wiki command" means `/wiki`. "The wiki" by itself usually means the project wiki (`wiki/*.md`). If ambiguous, ask.

## 6. Plugin rules

The plugin ships rules that enforce baseline guardrails (git safety, bash simplicity, wiki over memory). These live in `repo/.claude/rules/` and load on every prompt, but they only get there when `/project-init` copies them from the plugin.

**Run `/project-init` periodically**, especially after a plugin update, to sync the latest rules into the project. After the first sync, rules are committed to the project's git repo, so all teammates get them via `git pull`.

## 7. Which skill handles what

When the user asks a question and you need to load a skill, use this routing table. Pick ONE primary skill. Others may load transitively.

| Topic | Primary skill |
|-------|--------------|
| Git commit, push, PR, tag | `git-safety` (then `conventional-commits` for the message) |
| Bash command failing or prompting | `bash-simplicity` |
| Wiki content, page conventions, what belongs where | `wiki` |
| Memory vs wiki vs skill, where to save knowledge | `wiki` (Wiki Over Memory section) |
| Project layout, symlinks, `.simpleapps/` config | `project-defaults` |
| CLAUDE.md, rules, skill authoring, context budget | `context-efficiency` |
| Writing standards, RFC 2119, soft vs strong language | `writing-style` |
| Autonomous execution, when to stop and ask, RFC 2119 compliance | `work-habits` |
| Lint, format, typecheck, test, dead code | `quality` |
| Lifecycle (triage to publish), Basecamp ↔ GitHub flow | `workflow` |
| Submit / Deploy / Publish step execution | `deployment` |
| GitHub issues, PRs, gh CLI, org structure | `github` |
| Basecamp todos, messages, MCP tools | `basecamp` |
| Augur API CRUD across sites | `augur-api` |
| `@simpleapps-com/augur-*` packages, custom code vs shared | `augur-packages` |
| Fyxer meeting recordings | `fyxer` |
| Claude Code itself, features, hooks, plugins | `claude-code-docs` |

If two skills could apply, prefer the more specific one. If still unsure, ask the user rather than loading both.

## 8. Key conventions

Highlight the most important rules:
- **Git safety**: MUST NOT commit, push, create PRs, or merge unless explicitly asked
- **Bash simplicity**: one command per call, no `$()` or `2>&1`, use dedicated tools
- **Conventional commits**: `feat:`, `fix:`, `chore:`, etc.
- **RFC 2119**: MUST/SHOULD/MAY in ALL CAPS for requirements
- **Token efficiency**: be concise, action verbs first, no filler
- **WIP files**: named `{BC|GH}{#}-{slug}.md` in `wip/`

## 9. Ask

After presenting the guide, ask: "What would you like to work on?" or "Want me to run `/triage` to see what's open?"
