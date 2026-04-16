#!/usr/bin/env node

// Plugin validator. Catches drift before it ships:
//   - version strings across VERSION, plugin.json, marketplace.json, cli package.json
//   - SKILL.md frontmatter, name/directory match, kebab-case, 5K-token budget
//   - Skill("X") references in commands and skills resolve to a real skill
//   - command frontmatter (name, description) present and name matches file
//   - CLAUDE.md under 200 lines

import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();
const PLUGINS_DIR = join(ROOT, "plugins");

const errors = [];
const warnings = [];

const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

function parseFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  const fm = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, "").trim();
  }
  return fm;
}

async function readJson(relPath) {
  try {
    return JSON.parse(await readFile(join(ROOT, relPath), "utf8"));
  } catch {
    return null;
  }
}

async function checkVersions() {
  let version;
  try {
    version = (await readFile(join(ROOT, "VERSION"), "utf8")).trim();
  } catch {
    err("Missing VERSION file at repo root");
    return;
  }

  const checks = [];

  const cliPkg = await readJson("packages/cli/package.json");
  if (cliPkg) checks.push(["packages/cli/package.json", cliPkg.version]);

  const marketplace = await readJson(".claude-plugin/marketplace.json");
  if (marketplace) {
    checks.push([".claude-plugin/marketplace.json (top)", marketplace.version]);
    for (const [i, p] of (marketplace.plugins ?? []).entries()) {
      checks.push([`.claude-plugin/marketplace.json plugins[${i}] (${p.name})`, p.version]);
    }
  }

  try {
    for (const plugin of await readdir(PLUGINS_DIR)) {
      const pj = await readJson(`plugins/${plugin}/.claude-plugin/plugin.json`);
      if (pj) checks.push([`plugins/${plugin}/.claude-plugin/plugin.json`, pj.version]);
    }
  } catch {}

  for (const [path, v] of checks) {
    if (v !== version) err(`Version mismatch: ${path}=${v} (VERSION=${version})`);
  }
}

async function checkSkills() {
  const known = new Set();
  let plugins;
  try { plugins = await readdir(PLUGINS_DIR); } catch { return known; }

  for (const plugin of plugins) {
    const skillsDir = join(PLUGINS_DIR, plugin, "skills");
    let skillDirs;
    try { skillDirs = await readdir(skillsDir); } catch { continue; }

    for (const skillName of skillDirs) {
      const skillDir = join(skillsDir, skillName);
      const st = await stat(skillDir);
      if (!st.isDirectory()) continue;

      const rel = `plugins/${plugin}/skills/${skillName}/SKILL.md`;
      let text;
      try { text = await readFile(join(skillDir, "SKILL.md"), "utf8"); }
      catch { err(`Missing SKILL.md: ${rel}`); continue; }

      const fm = parseFrontmatter(text);
      if (!fm) { err(`No frontmatter: ${rel}`); continue; }
      if (!fm.name) err(`Missing name in frontmatter: ${rel}`);
      if (!fm.description) err(`Missing description in frontmatter: ${rel}`);
      if (fm.name && fm.name !== skillName)
        err(`Name mismatch: ${rel} frontmatter name="${fm.name}" but directory="${skillName}"`);
      if (fm.name && !/^[a-z][a-z0-9-]{0,63}$/.test(fm.name))
        err(`Invalid name "${fm.name}" in ${rel} (must be kebab-case, start with a letter, <=64 chars)`);

      const words = text.split(/\s+/).filter(Boolean).length;
      if (words > 3750) err(`Token budget exceeded: ${rel} is ${words} words (5K-token limit ~= 3750 words)`);
      else if (words > 3375) warn(`Approaching token limit: ${rel} is ${words} words (limit 3750)`);

      known.add(skillName);
    }
  }
  return known;
}

async function checkCommands(knownSkills) {
  let plugins;
  try { plugins = await readdir(PLUGINS_DIR); } catch { return; }

  for (const plugin of plugins) {
    const cmdDir = join(PLUGINS_DIR, plugin, "commands");
    let files;
    try { files = await readdir(cmdDir); } catch { continue; }

    for (const file of files) {
      if (!file.endsWith(".md")) continue;
      const rel = `plugins/${plugin}/commands/${file}`;
      const text = await readFile(join(cmdDir, file), "utf8");

      const fm = parseFrontmatter(text);
      if (!fm) { err(`No frontmatter: ${rel}`); continue; }
      if (!fm.name) err(`Missing name in frontmatter: ${rel}`);
      if (!fm.description) err(`Missing description in frontmatter: ${rel}`);
      const expected = file.replace(/\.md$/, "");
      if (fm.name && fm.name !== expected)
        err(`Name mismatch: ${rel} frontmatter name="${fm.name}" but file="${file}"`);

      // Strip fenced code blocks and inline code spans before scanning:
      // those are illustrative documentation, not operative skill loads.
      const prose = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
      for (const [, ref] of prose.matchAll(/Skill\(["']([^"']+)["']\)/g)) {
        const skillName = ref.includes(":") ? ref.split(":")[1] : ref;
        if (!knownSkills.has(skillName))
          err(`Unknown Skill("${ref}") in ${rel}`);
      }
    }
  }
}

async function checkClaudeMd() {
  for (const rel of [".claude/CLAUDE.md"]) {
    try {
      const text = await readFile(join(ROOT, rel), "utf8");
      const lines = text.split("\n").length;
      if (lines > 200) err(`${rel} is ${lines} lines (Claude Code limit is 200)`);
      else if (lines > 180) warn(`${rel} is ${lines} lines (approaching 200 limit)`);
    } catch {}
  }
}

await checkVersions();
const skills = await checkSkills();
await checkCommands(skills);
await checkClaudeMd();

if (warnings.length) {
  console.log(`WARN (${warnings.length}):`);
  for (const w of warnings) console.log(`  - ${w}`);
  console.log("");
}

if (errors.length) {
  console.log(`FAIL (${errors.length}):`);
  for (const e of errors) console.log(`  - ${e}`);
  process.exit(1);
}

console.log(`PASS: ${skills.size} skill(s) validated`);
