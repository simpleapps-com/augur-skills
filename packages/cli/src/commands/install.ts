import { filterEntries, getRegistry } from "../registry.js";
import { installSkills } from "../installer.js";
import type { Scope } from "../utils/paths.js";
import { logger } from "../utils/logger.js";

export async function installCommand(
  query: string,
  options: { scope: Scope },
): Promise<void> {
  const entries = await getRegistry();

  if (entries.length === 0) {
    logger.warn("No skills available yet. Plugins will be added in future releases.");
    return;
  }

  const matched = filterEntries(entries, query);

  if (matched.length === 0) {
    logger.error(`No skills found matching "${query}".`);
    logger.info("Run 'augur-skills list' to see available skills.");
    return;
  }

  const results = await installSkills(matched, options.scope);

  for (const result of results) {
    logger.success(`Installed ${result.skill} -> ${result.targetPath}`);
  }

  logger.info(
    `${results.length} skill(s) installed (scope: ${options.scope}).`,
  );
}
