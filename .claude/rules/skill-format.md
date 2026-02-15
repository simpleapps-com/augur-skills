---
description: SKILL.md frontmatter and content format
globs: plugins/**/SKILL.md
---

# SKILL.md Format Rules

Every SKILL.md MUST begin with YAML frontmatter:

```yaml
---
name: skill-name
description: Brief description of what the skill does and when to use it
---
```

Required frontmatter fields:
- `name` - Kebab-case skill identifier (lowercase letters, numbers, hyphens; max 64 chars). If omitted, uses directory name.
- `description` - Human-readable description. Claude uses this to decide when to apply the skill. If omitted, uses first paragraph of markdown content.

Optional frontmatter fields:
- `argument-hint` - Hint shown during autocomplete for expected arguments
- `disable-model-invocation` - Set to `true` to prevent Claude from auto-loading this skill
- `user-invocable` - Set to `false` to hide from the `/` menu
- `allowed-tools` - Tools Claude can use without asking permission when skill is active
- `model` - Model to use when this skill is active
- `context` - Set to `fork` to run in a forked subagent context
- `agent` - Subagent type to use when `context: fork` is set
- `hooks` - Hooks scoped to this skill's lifecycle

Content after frontmatter contains the skill instructions in markdown.

Version is tracked at the plugin level (`plugin.json`), NOT in individual SKILL.md files.
