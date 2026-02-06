import path from "node:path";
import fs from "fs-extra";
import type { SkillEntry } from "./registry.js";
import type { Scope } from "./utils/paths.js";
import { getSkillsDir } from "./utils/paths.js";

export interface InstallResult {
  skill: string;
  targetPath: string;
}

/** Install skills to the target directory based on scope */
export async function installSkills(
  entries: SkillEntry[],
  scope: Scope,
): Promise<InstallResult[]> {
  const skillsDir = getSkillsDir(scope);
  const results: InstallResult[] = [];

  for (const entry of entries) {
    const targetPath = path.join(skillsDir, entry.skill);
    await fs.ensureDir(targetPath);
    await fs.copy(entry.sourcePath, targetPath, { overwrite: true });
    results.push({ skill: entry.name, targetPath });
  }

  return results;
}

/** Uninstall skills by removing their directories */
export async function uninstallSkills(
  pluginName: string,
  scope: Scope,
): Promise<string[]> {
  const skillsDir = getSkillsDir(scope);
  const removed: string[] = [];

  if (!(await fs.pathExists(skillsDir))) return removed;

  const dirs = await fs.readdir(skillsDir);
  for (const dir of dirs) {
    const dirPath = path.join(skillsDir, dir);
    const stat = await fs.stat(dirPath);
    if (!stat.isDirectory()) continue;

    // Check if this skill belongs to the plugin by checking SKILL.md content
    // For simplicity, we track by directory name matching skill names from the plugin
    // In practice, we'd store metadata during install
    const skillMd = path.join(dirPath, "SKILL.md");
    if (await fs.pathExists(skillMd)) {
      const content = await fs.readFile(skillMd, "utf-8");
      // Check frontmatter for plugin reference or match by directory name
      if (
        content.includes(`plugin: ${pluginName}`) ||
        dir.startsWith(pluginName)
      ) {
        await fs.remove(dirPath);
        removed.push(dir);
      }
    }
  }

  return removed;
}
