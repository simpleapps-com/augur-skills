# Project Structure & Wiki Workflow

## Local Layout

Every project MUST use this layout:

```
{project}/
├── repo/        # Main git repo (simpleapps-com/<name>.git)
├── wiki/        # GitHub wiki repo (simpleapps-com/<name>.wiki.git)
├── wip/         # Work-in-progress files for active tasks (not in git)
└── protected/   # Secrets and credentials for dev testing (not in git)
```

The parent `{project}/` directory is NOT a git repo — it's a local wrapper that keeps the code repo and wiki side-by-side. The `wip/` and `protected/` directories sit outside both git trees so their contents can never be accidentally committed.

## Why This Pattern

- GitHub wikis are separate git repos. Cloning them alongside the code keeps everything local and searchable.
- AI agents (Claude Code) can `Read` wiki files from disk instantly instead of fetching URLs.
- The wiki becomes the **source of truth for dev docs**. The repo stays focused on product code.

## Setting Up a New Project

```bash
mkdir {project}
cd {project}
git clone https://github.com/simpleapps-com/<name>.git repo
git clone https://github.com/simpleapps-com/<name>.wiki.git wiki
```

If the wiki repo doesn't exist yet, create it by adding any page via the GitHub wiki UI first, then clone.

## What Goes Where

| Content | Location | Examples |
|---------|----------|---------|
| Product code | `repo/` | Source, tests, configs, SKILL.md files |
| Dev documentation | `wiki/` | Architecture, guides, specs, conventions |
| Repo README | `repo/README.md` | Minimal — quick start + link to wiki |
| Repo `.claude/rules/` | `repo/` | Minimal summaries referencing wiki pages |
| Repo `.claude/CLAUDE.md` | `repo/` | Quick reference + wiki links |
| Active task context | `wip/` | WIP files for Basecamp todos or GitHub issues |
| Dev secrets | `protected/` | API keys, tokens, test credentials |

Rule of thumb: if a `.md` file isn't built into the end product, it belongs in the wiki. If it contains secrets or ephemeral task state, it belongs outside both git trees.

## WIP Directory

The `wip/` directory holds work-in-progress files that AI agents create when picking up tasks from Basecamp or GitHub issues. Each file tracks research, plans, and progress for an active task.

### Naming Convention

`{issue-number}-{short-description}.md` — e.g., `14-basecamp-mcp-auto-refresh-oauth.md`

### Lifecycle

1. Agent picks up a Basecamp todo or GitHub issue
2. Creates a WIP file with research findings and implementation plan
3. Updates the file as work progresses
4. File remains after completion as a record of decisions made

### What belongs in WIP

- Research findings and code analysis
- Detailed implementation plans
- Decision rationale
- Test results and verification notes

### What does NOT belong in WIP

- Secrets, credentials, or tokens (use `protected/`)
- Final documentation (use `wiki/`)
- Code (use `repo/`)

## Protected Directory

The `protected/` directory stores secrets and credentials needed during development and testing. It sits outside all git trees so nothing can be accidentally committed.

Examples: API keys, OAuth tokens, test credentials, `.env` files for local testing.

MUST NOT be committed to any git repository. MUST NOT be copied into `repo/` or `wiki/`.

## Referencing Wiki from Repo

Repo files SHOULD use **relative filesystem paths** to reference wiki content:

```markdown
Full docs: ../../../wiki/Versioning.md
```

Relative paths work for Claude Code (local file reads). GitHub URLs require network access and are slower.

## Wiki Conventions

### Page Naming

- Use **PascalCase** with hyphens: `Getting-Started.md`, `Plugin-Structure.md`
- Match the pattern used in GitHub wiki URLs: `wiki/Page-Name`

### _Sidebar.md

Every wiki MUST have a `_Sidebar.md` for navigation. Group pages by topic:

```markdown
**[[Home]]**

**Getting Started**
- [[Getting-Started]]

**Architecture**
- [[Architecture]]
- [[Plugin-Structure]]

**Development**
- [[Development]]
- [[Versioning]]
```

### Linking

- Use `[[Page-Name]]` wiki links for internal links (renders on GitHub wiki)
- Use `[[Display Text|Page-Name]]` for custom link text

### Content Guidelines

- Wiki pages are the **full, detailed** version of documentation
- Each page SHOULD be self-contained — don't assume the reader has seen other pages
- Include examples, code blocks, and tables where they help
- Use RFC 2119 keywords (MUST/SHOULD/MAY) for requirements

### Committing Wiki Changes

The wiki is a regular git repo. Commit and push like any other:

```bash
cd {project}/wiki
git add -A && git commit -m "docs: add architecture page"
git push origin master
```

Note: GitHub wikis typically use `master` as the default branch, not `main`.
