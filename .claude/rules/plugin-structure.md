---
description: Plugin directory structure conventions
globs: plugins/**/*
---

# Plugin Structure

Full docs: [Plugin Structure](../../../wiki/Plugin-Structure.md)

Each plugin MUST have `.claude-plugin/plugin.json` (name, description, version) and at least one of: `skills/`, `agents/`, `commands/`.

Each skill MUST have `SKILL.md` with YAML frontmatter. See [Skill Format](../../../wiki/Skill-Format.md#required-frontmatter).
