import { uninstallSkills } from "../installer.js";
import type { Scope } from "../utils/paths.js";
import { logger } from "../utils/logger.js";

export async function uninstallCommand(
  pluginName: string,
  options: { scope: Scope },
): Promise<void> {
  const removed = await uninstallSkills(pluginName, options.scope);

  if (removed.length === 0) {
    logger.warn(`No installed skills found for plugin "${pluginName}".`);
    return;
  }

  for (const name of removed) {
    logger.success(`Uninstalled ${name}`);
  }

  logger.info(
    `${removed.length} skill(s) uninstalled (scope: ${options.scope}).`,
  );
}
