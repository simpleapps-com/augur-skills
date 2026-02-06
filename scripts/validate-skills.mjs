#!/usr/bin/env node

/**
 * Validate all SKILL.md files in plugins/ have correct frontmatter.
 * Required fields: name, description, version
 */

import { readdir, stat, readFile } from "node:fs/promises";
import { join } from "node:path";

const PLUGINS_DIR = join(process.cwd(), "plugins");
const REQUIRED_FIELDS = ["name", "description", "version"];

async function findSkillFiles(dir) {
  const files = [];
  try {
    const entries = await readdir(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const s = await stat(fullPath);
      if (s.isDirectory()) {
        files.push(...(await findSkillFiles(fullPath)));
      } else if (entry === "SKILL.md") {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist yet
  }
  return files;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const fields = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) {
      fields[key.trim()] = rest.join(":").trim();
    }
  }
  return fields;
}

async function main() {
  const skillFiles = await findSkillFiles(PLUGINS_DIR);

  if (skillFiles.length === 0) {
    console.log("No SKILL.md files found. Skipping validation.");
    process.exit(0);
  }

  let errors = 0;

  for (const file of skillFiles) {
    const content = await readFile(file, "utf-8");
    const frontmatter = parseFrontmatter(content);
    const relative = file.replace(process.cwd() + "/", "");

    if (!frontmatter) {
      console.error(`ERROR: ${relative} - Missing YAML frontmatter`);
      errors++;
      continue;
    }

    for (const field of REQUIRED_FIELDS) {
      if (!frontmatter[field]) {
        console.error(`ERROR: ${relative} - Missing required field: ${field}`);
        errors++;
      }
    }
  }

  if (errors > 0) {
    console.error(`\n${errors} validation error(s) found.`);
    process.exit(1);
  }

  console.log(`Validated ${skillFiles.length} SKILL.md file(s). All OK.`);
}

main();
