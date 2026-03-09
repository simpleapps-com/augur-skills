# Wiki Maintenance

Guidance for agents editing wiki content. Applies to all `wiki/*.md` files across all projects.

## Verify Before You Write

Cross-check wiki claims against the codebase before updating. Staleness-prone sections:

- Package versions (`package.json` is the source of truth)
- File counts and file inventories (files get added/deleted)
- CI/CD workflow status (workflows get added/modified)
- TODO items and "not yet built" markers (things get done)
- Export lists and API surfaces (code changes)

**Never echo what the wiki already says.** Read the code, then write the wiki.

## Patterns, Not Details

The wiki documents **conventions and principles**. The code is the source of truth for specifics.

- No hardcoded counts ("22 components", "14 hooks" — these change)
- No exhaustive lists of every type, hook, component, or export by name
- No pinned version numbers for peer dependencies
- Instead: describe the pattern, give 1-2 examples, point to source code for the current list

## Naming Conventions

Follow the project's existing convention:

- **Site wikis**: PascalCase with hyphens (`Getting-Started.md`, `Architecture.md`)
- **Package wikis**: Prefix-based sections (`guide-*.md` for users, `design-*.md` for contributors)

Check `Home.md` or `_Sidebar.md` to confirm the convention before creating new pages.

## Keep Indexes Current

When adding or removing pages, MUST update:

- `Home.md` / `README.md` (index tables)
- `_Sidebar.md` (navigation)
- `llms.txt` (if present)

## Tagging for Lead-Site Wikis

The lead site wiki (e.g., ampro-online) serves as both site documentation and platform reference. Tag sections:

- **(platform pattern)** — guidance all sites SHOULD follow
- **(site-specific)** — this site's particular values, replace with your own

This tells agents working on other sites what to replicate vs customize.

## Dual-Audience Framing

Lead site wikis serve two audiences:

1. Developers/agents working on **that site**
2. Developers/agents building or migrating **other sites**

Write for both: document current reality AND provide guidance others can follow.

## Git Workflow

The wiki is a separate git repo at `wiki/`. No branch protection, no PRs, no changesets.

```bash
git -C wiki add -A
git -C wiki commit -m "docs: describe the change"
git -C wiki push
```

Wiki repos typically use `master` as the default branch.
