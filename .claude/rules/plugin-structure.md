---
description: Plugin directory structure conventions
globs: plugins/**/*
---

# Plugin Structure Rules

Each plugin MUST have:
- `plugins/<name>/.claude-plugin/plugin.json` with name, description, version
- At least one of: `skills/`, `agents/`, `commands/`

Each skill MUST have:
- `plugins/<name>/skills/<skill-name>/SKILL.md`
- SKILL.md MUST contain YAML frontmatter with: name, description, version

Optional plugin directories:
- `agents/` - Subagent definition files
- `commands/` - Markdown slash command files
- `hooks/` - Event handlers
- `references/` - Reference materials for skills
- `scripts/` - Automation scripts
