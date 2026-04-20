---
name: wiki
description: Wiki conventions for SimpleApps projects. Covers token budget, writing for three audiences, page conventions, maintenance rules, and git workflow. Use when reading, writing, or auditing wiki content.
allowed-tools:
  - Read
  - Glob
  - Grep
  - Edit
  - Write
  - Bash
---

# Wiki

The wiki is the **single source of truth** for how a project works. The wiki is the spec; the repo is the implementation.

## Why This Design

The wiki is a **git-backed markdown folder** (`wiki/`) living next to the code repo (`repo/`), read by agents as local files via `Read wiki/*.md`. Every design choice answers a specific failure mode:

- **Markdown in git**: the docs live where the work lives and version alongside the code. Diffs show what changed and why. No login, no API, no stale snapshot.
- **Separate `wiki/` repo, not embedded in the code repo**: the wiki ships independently of code releases. Doc fixes do not wait on code review cycles, and code commits stay clean of doc noise.
- **Local file reads, not network fetches**: the agent loads the full wiki at session start with zero latency. No rate limits, no auth, works offline.
- **20K token budget**: small enough that the agent holds the whole wiki alongside working context with room to spare, and small enough that humans actually read and maintain it. Forces ruthless editing; a bloated wiki helps no one because no one reads past the first screen.
- **Process and principles, not code snippets**: code in the wiki rots the day it is pasted. Link to the source file instead, so the wiki stays true as the code evolves.

The payoff: **the agent and the user share the same model of the project.** Less re-explaining, fewer guesses, fewer "I assumed..." mistakes. Work goes faster because the agent already knows the conventions, and safer because the agent is not improvising decisions the wiki already settled.

## Token Budget

The default wiki budget is **20K tokens** (~15K words, ~60KB). The budget is an editing constraint, not a capacity limit. It is small enough that agents load the whole wiki alongside working context with room to spare, small enough that humans actually read and maintain it, and strict enough to force pruning as the project grows.

Projects MAY raise the budget by adding two HTML comment markers near the top of `wiki/Home.md`:

```
<!-- wiki-token-budget: 25000 -->
<!-- wiki-token-budget-reason: Complex integration catalog requires extended reference -->
```

HTML comments are invisible in the rendered wiki but parseable by agents. Storing the override in the wiki itself means it travels with the repo across machines and teammates; `.simpleapps/` and other gitignored local config are NOT acceptable locations because they do not sync.

Raising the budget is its own decision, separate from any other command. MUST NOT raise the budget under the blanket approval of `/curate-wiki`, `/wiki-audit`, or any other command. The user MUST explicitly approve both the **specific new number** and author the **reason** in their own words. `/curate-wiki` surfaces the prompt and performs the edit only after the user names the number and provides the reason. Never raise the budget silently. Never infer a number the user did not state.

Check size: `wc -w wiki/*.md` (multiply by ~1.3 for token estimate)

## Core Principle

Repo files (`.claude/CLAUDE.md`, `.claude/rules/`, `README.md`) MUST be minimal: orient then point to wiki. CLAUDE.md MUST link to every wiki content page. These links cost ~15 tokens total but make every page one Read away from always-loaded context. AI agents read wiki pages as local files via `Read wiki/<page>.md`. No network requests needed.

```
Wiki defines → Code implements → Learnings update wiki → Repeat
```

When code reveals the wiki is wrong or incomplete, update immediately. The wiki MUST reflect reality, not aspirations.

## Learning Organization

Wikis are not just for the current project. They build institutional knowledge across the organization:

- **Site → Site**: Other projects using the same tools learn from this wiki. Document what worked, what didn't, and why. Future sites benefit from your experience.
- **Site → Packages**: The packages team reads site wikis to understand real usage patterns, pain points, and gaps. Your wiki helps them build better shared tools.
- **Packages → Site**: Package docs and conventions flow back into site wikis as shared patterns.

Write as if someone on a different project will read this wiki to understand how you solved a similar problem. Tag sections **(platform pattern)** when the approach applies to all sites using the same stack, and **(site-specific)** when it's unique to this project.

## Three Audiences

Every page serves junior devs (explanations, examples), senior devs (quick reference, decisions), and AI agents (unambiguous specs, MUST/SHOULD/MAY). Write for all three:

- Lead with a summary so seniors and agents get it fast and juniors get orientation
- Explain *why* before *how*
- Use tables for reference, code blocks for copy-paste, RFC 2119 keywords for requirements
- Each page SHOULD be self-contained
- Follow `simpleapps:writing-style` for token-efficient prose, action verbs first, no filler

## Content Rules

- The wiki documents **process and principles**, not code. Minimize code examples. Describe the pattern, then link to a real file in the repo that demonstrates it. A link to working code is always better than a pasted snippet that can go stale.
- If a code block is necessary (e.g., a command to run), keep it to 1-3 lines max.
- The wiki documents *what* and *why*. The repo is the source of truth for *how*.

## Conventions

- Page naming: **PascalCase** with hyphens (`Getting-Started.md`)
- Every wiki MUST have `_Sidebar.md` for navigation
- Links: `[[Page-Name]]` or `[[Display Text|Page-Name]]`
- Anchor links MUST target specific sections (`[[Versioning#version-bump-procedure]]`), not just pages
- Repo references: use relative paths (`../../../wiki/Versioning.md`)
- Wiki repo default branch: `master` (GitHub's `.wiki.git` convention; applies to the `wiki/` repo only, not the code repo). Code repos may use `main` or `master`. Check with `git -C repo branch --show-current`.

## Cross-Linking

Cross-linking is the most important structural feature of a wiki. Without it, a wiki is just a collection of files. With it, a wiki becomes a **knowledge graph** where each link is an attention signal that tells readers (human and AI) "this concept connects to that one."

Pages MUST link to related sections on other pages using `[[Page-Name#section]]`. Link to specific sections, not just pages. Every concept that is explained in more detail elsewhere MUST have a cross-link.

Cross-linking also eliminates duplication. If two pages explain the same concept, one MUST become the source of truth and the other MUST link to it. Never duplicate content across pages; link instead. This keeps the wiki lean and ensures updates happen in one place.

### Link strategy: contextual, not link-farm

A link is only as useful as the words around it. The same rule serves both audiences:

- **Humans** scan anchor text and surrounding prose to decide whether to click. This is basic SEO; descriptive anchors win.
- **LLMs** weight links via the attention mechanism, which uses the surrounding tokens to decide what the link is about. A bare title in a "Related" list has no context to anchor against.

A link farm starves both readers. Humans see undifferentiated blue text; the LLM sees a list of titles with no relevance signal.

**MUST: place links inline, in the prose, at the moment the concept is mentioned.** That sentence is the link's context for both readers.

```
✅ Versioning follows [[Versioning#calver|CalVer (YYYY.MM.seq)]]. See the
   procedure for [[Versioning#version-bump-procedure|bumping all version files together]].

❌ ## Related
   - [[Versioning]]
   - [[Deployment]]
   - [[Architecture]]
```

**MUST: anchor text describes what the link is about**, not "click here" or "see also" or the bare page title with no context. The reader (human or AI) should understand the destination from the anchor text alone.

```
✅ [[Skill-Format#required-frontmatter|the required SKILL.md frontmatter fields]]
❌ [[Skill-Format|click here]]
❌ [[Skill-Format]]   ← acceptable if the surrounding sentence supplies the context;
                       avoid as the only signal.
```

**SHOULD NOT: create "Related", "See also", or "Further reading" sections as link dumps.** If a connection matters, work it into the prose where it matters. The exception is genuine navigation pages (`Home.md`, `_Sidebar.md`, `llms.txt`); those exist to be link indexes.

When auditing a page, count the trailing-list links vs. inline links. If trailing-list links outnumber inline links, the page is a directory entry, not a knowledge page. Rewrite to put the connections where the reader needs them.

## Wiki Over Memory

When asked to save, document, or record knowledge, use the wiki. MUST NOT use memory. The wiki is shared across all agents, all projects, and all computers. Memory is personal to one user on one machine and invisible to everyone else.

| Knowledge type | Where it belongs |
|---------------|-----------------|
| Behavioral guardrails and corrections | **Skill** (update the relevant skill) |
| Conventions, patterns, decisions | **Wiki** |
| Learnings from a task or session | **Wiki** |
| Architecture and process docs | **Wiki** |
| How a problem was solved | **Wiki** |
| Personal preferences (writing style, response length) | Memory |
| User role and background | Memory |

If the user corrects your behavior, update the relevant **skill**, not memory. A correction saved to memory only helps one agent on one machine. A correction in a skill helps every agent on every project.

If in doubt, it belongs in the wiki or a skill. The cost of putting shared knowledge in memory is that it dies with the session; no other agent, project, or computer will ever see it.

### Versioned sources win over memory

When a recalled memory conflicts with the wiki, a rule, CLAUDE.md, or a skill, you MUST follow the versioned source and ignore the memory. Memory is:

- **Personal**: lives on one machine, invisible to other agents and teammates
- **Unauditable**: the user cannot easily review or version-control what an agent has saved
- **Often wrong**: agents save memories from misunderstandings, outdated context, or half-formed rules

Anything checked into git (wiki pages, `.claude/rules/*.md`, `CLAUDE.md`, skills) is the contract. Memory is at most a personal hint. YOU MUST NOT use memory to downgrade, override, or work around a MUST from a versioned source. If memory says X but the wiki says MUST NOT X, the wiki wins, every time.

When you detect a conflict:

1. Follow the versioned source
2. Remove or rewrite the offending memory file (update `MEMORY.md` index too)
3. Report the conflict to the user so they know memory was incorrect

"The memory told me otherwise" is never a valid reason to deviate from the wiki, a rule, or a skill. If you catch yourself reaching for that reasoning, stop. The memory is the problem, not the directive.

## Cross-Project Wiki Access

All projects follow the same directory layout (see `simpleapps:project-defaults`). Every project's wiki is at a predictable path relative to the project root: `{project}/wiki/`. When the user asks you to check another project's wiki or code, use the project-defaults layout to find it.

**Before reading another project's wiki, pull the latest:**
`git -C {path-to-project}/wiki pull`

**MUST use dedicated tools for cross-project access. MUST NOT use shell commands:**
- Read files: `Read("{path-to-project}/wiki/Page.md")`
- Search code: `Grep(pattern: "...", path: "{path-to-project}/repo")`
- Find files: `Glob(pattern: "{path-to-project}/repo/**/*.ts")`

MUST NOT use `find`, `grep`, `cat`, `ls`, or any shell command to explore other projects. The paths are known; use the dedicated tools directly.

### Search all wikis

Every wiki on the machine is a local knowledge base. When looking for how something was solved, search across ALL wikis, not just the current project:

1. Read `~/.simpleapps/settings.json` to get `projectRoot`
2. Pull the latest for all wikis before searching:
   - `git -C {projectRoot}/clients/*/wiki pull` (one call per wiki, not a glob)
   - `git -C {projectRoot}/simpleapps/*/wiki pull`
3. Search across all wikis with Grep:
   - `Grep(pattern: "...", path: "{projectRoot}/clients", glob: "*/wiki/*.md")`
   - `Grep(pattern: "...", path: "{projectRoot}/simpleapps", glob: "*/wiki/*.md")`
4. Read the matching pages to get the full context

Use Glob to discover which projects have wikis: `Glob(pattern: "{projectRoot}/clients/*/wiki")` and `Glob(pattern: "{projectRoot}/simpleapps/*/wiki")`.

The wikis are kept fresh by `/curate-wiki` runs across projects. Searching locally is instant and requires no internet access; the knowledge is already on the machine.

**What to search for:** testing patterns and checklists, architecture decisions, coding conventions, deployment procedures, and how specific features were implemented. Other sites have already solved many of the same problems; search before building from scratch.

## Deployment Page

Every project wiki MUST have a `Deployment.md` page with up to three sections: Submit, Deploy, and Publish. This page defines the project-specific steps that `/submit`, `/deploy`, and `/publish` commands execute. Run `/curate-wiki` to generate it from the codebase. The command scans CI workflows, package.json, deploy scripts, and asks the user about anything it cannot determine. See the `deployment` skill for the expected format.

## Testing Page

Every project wiki MUST have a `Testing.md` page. This is the E2E verification checklist that `/verify` uses to walk through the site in Chrome. The page grows over time. `/curate-wiki` MUST add testing knowledge learned during the session (new edge cases, failure patterns, test data) to the Testing page.

A good Testing page covers: test tiers (automated vs manual), test data (items, accounts, cards), and an E2E checklist organized by page area (homepage, listing, detail, cart, checkout, etc.). Each checklist item is a concrete, verifiable condition, not vague ("works") but specific ("price shows $9.26").

## Keep It Lean

- Document patterns and principles, not exhaustive lists
- No hardcoded counts, no pinned versions, no full export inventories
- Describe the pattern, give 1-2 examples, point to source for current list
- Merge overlapping pages, archive obsolete ones

## Progressive Disclosure via Colocated Markdown

When a wiki topic grows detail that is only needed when actively working on that specific code path, relocate the detail into a markdown file colocated with the code. The wiki keeps a summary and a signpost; the colocated file becomes the source of truth. Every-session readers pay only for the summary; on-topic sessions load the full detail on demand.

### When this fits

- Module-level or subsystem depth (attribute system internals, pipeline stages, component APIs)
- Content needed in a minority of sessions (rule of thumb: under 50%)
- Detail that changes in the same commit as the code it describes

### When it does not fit

- Orientation, architecture, cross-cutting decisions (keep in the wiki)
- Deployment, testing, onboarding (these are the wiki's core job)
- Content not tied to a specific code path

### Location convention

Follow the codebase's existing doc-location convention. Do not impose a new one.

- `<module>/README.md` if the codebase uses per-module READMEs
- `<dir>/helpers/<topic>.md` if many siblings share a helpers folder
- `<module>/docs/<topic>.md` for deep subsystems with several topics
- `docs/<topic>.md` at repo root when the content does not map cleanly to one path

If no convention exists, propose one and match it across similar topics in the same session.

### Signpost format

The wiki MUST link to the colocated file by exact repo path and state the load condition:

```markdown
## Attributes

One-paragraph summary.

**Detail file:** `repo/src/helpers/attributes.md`
**Load when:** working in the attribute system (adding, editing, or debugging attributes).
```

The **Load when** clause is critical: without it, agents either ignore the signpost or load every signposted file at session start, defeating the budget win.

Wiki signposts SHOULD include keywords the agent will recognize when searching or scanning: the subsystem name, common domain terms, the API the subsystem exposes. Keyword-rich signposts increase the chance an agent notices it has landed in a subsystem that has detail docs available, instead of re-deriving everything from code.

### Subsystem doc hierarchies (index + leaves)

Large monorepos often have subsystems with many sibling items (helpers, components, plugin rules, rule engines) where per-item detail has meaningful variance. A single colocated file does not scale; use a nested structure instead.

**Structure:**

- `<subsystem>/README.md` MUST exist as the entry point. It orients the reader, explains the subsystem's purpose and conventions, and indexes the items that have their own detail docs.
- `<subsystem>/<item>.md` holds detail for individual items that are complex, non-obvious, or have subtle invariants.

**Selection rule for detail docs:** NOT every item gets a doc. Only items where the *why* and *how* pay back the maintenance cost. Items whose name and signature are self-explanatory MUST NOT get a doc; a doc that restates what the code already says is drift waiting to happen.

**Wiki signpost format** when a subsystem uses the nested pattern:

```markdown
## Attributes (attribute system, helpers)

One-paragraph summary.

**Entry point:** `repo/src/helpers/README.md`
**Load when:** working in the attribute system — adding, editing, or debugging attributes, or extending the schema. The README indexes per-helper detail docs for complex items.
```

Keywords in the page heading and the Load-when clause (subsystem name, adjacent terms, verbs that match what the agent is likely doing) help the agent recognize the subsystem on sight. The signpost points at the README, not at every leaf: the README is the hub, and the agent follows it to individual item docs as needed.

**Keep-current at both levels:** editing an item means updating its `.md` if it has one AND updating the README index when the item's entry there is now wrong (new complexity introduced, a doc was added or removed, an item was deleted). See `simpleapps:work-habits` "Leave it better than you found it" for the binding rule.

### Keep-current invariant

Colocated detail files are first-class code artifacts. When working on code that has one, agents MUST read it before editing, update it in the same commit when behavior it describes changes, and fix or flag it if it arrives stale. See `simpleapps:work-habits` "Leave it better than you found it" for the binding rule.

### Migration: topics that already exist in both places

When adopting this pattern for a topic that has a wiki page AND a stale colocated file (common if a colocated doc existed but drifted):

1. Read both. Identify the source of truth by comparing against the code.
2. Reconcile. Merge current-and-accurate content from both into a single updated version.
3. Land the reconciled version in the colocated file. It is the source of truth going forward.
4. Replace the wiki page body with the summary + signpost format above. Same commit (or paired commits across repos) so both sides land together.

After migration, the colocated file wins any conflict with the wiki; the wiki summary gets fixed, not the colocated file.

## Maintenance

Cross-check wiki against code before updating. Staleness-prone: versions, file counts, CI workflows, TODO markers, API surfaces. **Never echo what the wiki says. Read the code, then write.**

When adding/removing pages, MUST update: `Home.md`, `_Sidebar.md`, `llms.txt` (if present).

## Git Workflow

The wiki is a separate git repo at `wiki/`. No branch protection, no PRs.

```bash
git -C wiki add -A
# Write commit message using Write tool → tmp/commit-msg.txt
git -C wiki commit -F tmp/commit-msg.txt
rm tmp/commit-msg.txt
git -C wiki push
```
