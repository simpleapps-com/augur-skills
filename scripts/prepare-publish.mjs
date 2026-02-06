#!/usr/bin/env node

// Pre-publish script: copies plugin skills into packages/cli/skills/
// so skills ship with the npm tarball.
//
// Layout after copy:
//   packages/cli/skills/<plugin-name>/<skill-name>/SKILL.md

import { readdir, stat, cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const PLUGINS_DIR = join(process.cwd(), "plugins");
const CLI_SKILLS_DIR = join(process.cwd(), "packages", "cli", "skills");

async function main() {
  // Clean target
  await rm(CLI_SKILLS_DIR, { recursive: true, force: true });
  await mkdir(CLI_SKILLS_DIR, { recursive: true });

  let copied = 0;

  try {
    const plugins = await readdir(PLUGINS_DIR);

    for (const plugin of plugins) {
      const pluginPath = join(PLUGINS_DIR, plugin);
      const s = await stat(pluginPath);
      if (!s.isDirectory()) continue;

      const skillsPath = join(pluginPath, "skills");
      try {
        const skillsStat = await stat(skillsPath);
        if (!skillsStat.isDirectory()) continue;
      } catch {
        continue; // No skills/ directory in this plugin
      }

      const targetPluginDir = join(CLI_SKILLS_DIR, plugin);
      await cp(skillsPath, targetPluginDir, { recursive: true });

      const skills = await readdir(targetPluginDir);
      copied += skills.filter(async (s) => {
        const st = await stat(join(targetPluginDir, s));
        return st.isDirectory();
      }).length;

      console.log(`Copied ${plugin}/skills/ -> packages/cli/skills/${plugin}/`);
    }
  } catch {
    // plugins/ doesn't exist yet
  }

  if (copied === 0) {
    console.log("No skills to copy. packages/cli/skills/ is empty.");
  } else {
    console.log(`\nCopied ${copied} skill(s) for npm publish.`);
  }
}

main();
