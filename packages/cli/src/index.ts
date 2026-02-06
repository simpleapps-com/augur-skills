import { createRequire } from "node:module";
import { Command } from "commander";
import { listCommand } from "./commands/list.js";
import { installCommand } from "./commands/install.js";
import { uninstallCommand } from "./commands/uninstall.js";
import type { Scope } from "./utils/paths.js";

const require = createRequire(import.meta.url);
const pkg = require("../package.json") as { version: string };

const program = new Command();

program
  .name("augur-skills")
  .description("Install curated Claude Code skills")
  .version(pkg.version);

program
  .command("list")
  .description("List all available skills")
  .action(listCommand);

program
  .command("install <query>")
  .description(
    "Install skills by plugin name or plugin:skill (e.g., web-quality or web-quality:accessibility)",
  )
  .option(
    "-s, --scope <scope>",
    'Install scope: "user" (default) or "project"',
    "user",
  )
  .action((query: string, options: { scope: Scope }) => {
    return installCommand(query, options);
  });

program
  .command("uninstall <plugin>")
  .description("Uninstall all skills from a plugin")
  .option(
    "-s, --scope <scope>",
    'Uninstall scope: "user" (default) or "project"',
    "user",
  )
  .action((plugin: string, options: { scope: Scope }) => {
    return uninstallCommand(plugin, options);
  });

program.parse();
