---
name: guide
description: Learn how we work — workflow, available commands, skills, and conventions. Run this first if you're new to the project.
allowed-tools: Skill(workflow), Skill(project-defaults), Skill(github), Skill(writing-style), Skill(work-habits), Skill(conventional-commits), Skill(bash-simplicity), Read, Glob
---

First, load these skills for context:
1. Skill("project-defaults") — directory layout and setup
2. Skill("workflow") — how work flows from Basecamp to GitHub
3. Skill("github") — GitHub conventions
4. Skill("writing-style") — writing standards
5. Skill("work-habits") — how to work autonomously
6. Skill("conventional-commits") — commit message format

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

List each command with a one-line description and when to use it:

| Command | When to use |
|---------|-------------|
| `/triage` | Start of session — see what needs doing |
| `/wip <url>` | Pick a task — scaffold a WIP file from a Basecamp URL or GitHub issue |
| `/investigate` | Before coding — research the problem, update WIP with findings |
| `/commit-message` | After coding — generate a conventional commit message |
| `/wiki` | Need context — load the project wiki |
| `/wiki-audit` | Maintenance — check wiki health |
| `/project-init` | First time — set up directory structure |
| `/audit-augur-packages` | Migration — find custom code to replace with shared packages |
| `/guide` | Right now — you're reading it |

## 4. Typical session

Walk through a concrete example:

```
/triage                          → see open issues and PRs
/wip https://basecamp.com/...   → scaffold WIP from client request
/investigate                     → explore codebase, update WIP with findings
                                 → review the analysis, start coding
/commit-message                  → generate commit message when done
```

## 5. Available skills

Skills load reference material into context. They're loaded automatically by commands, but can also be loaded manually with `Skill("name")`:

| Skill | What it provides |
|-------|------------------|
| `basecamp` | Basecamp MCP tools, URL parsing, Chrome fallback |
| `workflow` | Basecamp-to-GitHub flow, cross-linking, issue templates |
| `github` | GH org conventions, `gh` CLI usage, git safety |
| `project-defaults` | Directory layout, symlinks, permission defaults |
| `wiki` | Wiki conventions, token budget, maintenance |
| `writing-style` | RFC 2119, token efficiency, audience-specific writing |
| `work-habits` | Autonomous work, context protection, error recovery |
| `conventional-commits` | Commit message format |
| `claude-code-docs` | Claude Code feature reference |
| `augur-api` | Augur API MCP tools and auth |
| `augur-packages` | Shared npm packages and anti-patterns |
| `fyxer` | Meeting transcript extraction and Basecamp posting |

## 6. Key conventions

Highlight the most important rules:
- **Git safety**: MUST NOT commit, push, create PRs, or merge unless explicitly asked
- **Conventional commits**: `feat:`, `fix:`, `chore:`, etc.
- **RFC 2119**: MUST/SHOULD/MAY in ALL CAPS for requirements
- **Token efficiency**: be concise, action verbs first, no filler
- **WIP files**: named `{BC|GH}{#}-{slug}.md` in `wip/`

## 7. Ask

After presenting the guide, ask: "What would you like to work on?" or "Want me to run `/triage` to see what's open?"
