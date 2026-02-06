import chalk from "chalk";
import { getRegistry } from "../registry.js";
import { logger } from "../utils/logger.js";

export async function listCommand(): Promise<void> {
  const entries = await getRegistry();

  if (entries.length === 0) {
    logger.info("No skills available yet. Plugins will be added in future releases.");
    return;
  }

  console.log(chalk.bold("\nAvailable Skills:\n"));

  const byPlugin = new Map<string, string[]>();
  for (const entry of entries) {
    const skills = byPlugin.get(entry.plugin) ?? [];
    skills.push(entry.skill);
    byPlugin.set(entry.plugin, skills);
  }

  for (const [plugin, skills] of byPlugin) {
    console.log(chalk.cyan(`  ${plugin}`));
    for (const skill of skills) {
      console.log(`    - ${plugin}:${skill}`);
    }
    console.log();
  }

  console.log(
    chalk.dim(`${entries.length} skill(s) across ${byPlugin.size} plugin(s)\n`),
  );
}
