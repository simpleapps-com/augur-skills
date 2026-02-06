---
description: SKILL.md frontmatter and content format
globs: plugins/**/SKILL.md
---

# SKILL.md Format Rules

Every SKILL.md MUST begin with YAML frontmatter:

```yaml
---
name: skill-name
description: Brief description of what the skill does
version: 1.0.0
---
```

Required frontmatter fields:
- `name` - Kebab-case skill identifier
- `description` - Human-readable description
- `version` - SemVer version string

Optional frontmatter fields:
- `author` - Skill author
- `tags` - Array of categorization tags
- `triggers` - Array of trigger phrases for skill invocation

Content after frontmatter contains the skill instructions in markdown.
