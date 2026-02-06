import path from "node:path";
import fs from "fs-extra";
import { getBundledSkillsDir } from "./utils/paths.js";

export interface SkillEntry {
  plugin: string;
  skill: string;
  /** Fully qualified name: plugin:skill */
  name: string;
  /** Absolute path to the skill directory in the bundle */
  sourcePath: string;
}

/**
 * Discover all bundled skills from the skills/ directory.
 *
 * Expected layout: skills/<plugin>/<skill>/SKILL.md
 */
export async function getRegistry(): Promise<SkillEntry[]> {
  const skillsDir = getBundledSkillsDir();
  const exists = await fs.pathExists(skillsDir);
  if (!exists) return [];

  const entries: SkillEntry[] = [];
  const plugins = await fs.readdir(skillsDir);

  for (const plugin of plugins) {
    const pluginPath = path.join(skillsDir, plugin);
    const stat = await fs.stat(pluginPath);
    if (!stat.isDirectory()) continue;

    const skills = await fs.readdir(pluginPath);
    for (const skill of skills) {
      const skillPath = path.join(pluginPath, skill);
      const skillStat = await fs.stat(skillPath);
      if (!skillStat.isDirectory()) continue;

      const skillMd = path.join(skillPath, "SKILL.md");
      if (await fs.pathExists(skillMd)) {
        entries.push({
          plugin,
          skill,
          name: `${plugin}:${skill}`,
          sourcePath: skillPath,
        });
      }
    }
  }

  return entries;
}

/** Filter registry entries by plugin name, or plugin:skill */
export function filterEntries(
  entries: SkillEntry[],
  query: string,
): SkillEntry[] {
  if (query.includes(":")) {
    return entries.filter((e) => e.name === query);
  }
  return entries.filter((e) => e.plugin === query);
}
