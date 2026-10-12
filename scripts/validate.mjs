#!/usr/bin/env node

// Plugin validator. Catches drift before it ships:
//   - version strings across VERSION, plugin.json, and marketplace.json
//   - SKILL.md frontmatter, name/directory match, kebab-case, 5K-token budget
//   - Skill("X") references in commands and skills resolve to a real skill
//   - command frontmatter (name, description) present and name matches file
//   - rules: no frontmatter (always-loaded plain markdown) + .claude/rules/ mirrors
//     the shared plugin rules (same-named files, plugin canonical)
//   - CLAUDE.md under 200 lines
//
// Run from the repo root (cwd = repo root); all paths are resolved relative to it.
// `validate(root)` is exported for scripts/validate.test.mjs.

import { realpathSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * One validation run: the paths it reads and what it found.
 * @typedef {{ root: string, pluginsDir: string, rulesDir: string, errors: string[], warnings: string[] }} Run
 */

/** @param {string} text */
function parseFrontmatter(text) {
  const m = text.match(/^---\n(?<body>[\s\S]*?)\n---/);
  if (!m?.groups) return null;
  /** @type {Record<string, string>} */
  const fm = {};
  for (const line of String(m.groups.body).split("\n")) {
    const kv = line.match(/^(?<key>[a-zA-Z_-]+):\s*(?<value>.*)$/);
    if (kv?.groups)
      fm[String(kv.groups.key)] = String(kv.groups.value)
        .replace(/^["']|["']$/g, "")
        .trim();
  }
  return fm;
}

/** A JSON file under the root; null when missing or invalid. */
async function readJson(run, relPath) {
  try {
    return JSON.parse(await readFile(join(run.root, relPath), "utf8"));
  } catch {
    return null;
  }
}

/** A directory's entries; [] when it does not exist. */
async function listDir(dir) {
  try {
    return await readdir(dir);
  } catch {
    return [];
  }
}

/** A file's text; null when it does not exist. */
async function readText(path) {
  try {
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

/** @param {Run} run */
async function checkVersions(run) {
  const versionText = await readText(join(run.root, "VERSION"));
  if (versionText === null) {
    run.errors.push("Missing VERSION file at repo root");
    return;
  }
  const version = versionText.trim();

  const checks = [];

  const marketplace = await readJson(run, ".claude-plugin/marketplace.json");
  if (marketplace) {
    checks.push([".claude-plugin/marketplace.json (top)", marketplace.version]);
    for (const [i, p] of (marketplace.plugins ?? []).entries()) {
      checks.push([`.claude-plugin/marketplace.json plugins[${i}] (${p.name})`, p.version]);
    }
  }

  for (const plugin of await listDir(run.pluginsDir)) {
    const pj = await readJson(run, `plugins/${plugin}/.claude-plugin/plugin.json`);
    if (pj) checks.push([`plugins/${plugin}/.claude-plugin/plugin.json`, pj.version]);
  }

  for (const [path, v] of checks) {
    if (v !== version) run.errors.push(`Version mismatch: ${path}=${v} (VERSION=${version})`);
  }
}

/**
 * Frontmatter `name`/`description` present; `name` equals `expected`. Null when there is none.
 * `shown` is how a mismatch names the source (`directory="x"`, `file="x.md"`).
 */
function checkFrontmatter(run, text, rel, expected, shown) {
  const fm = parseFrontmatter(text);
  if (!fm) {
    run.errors.push(`No frontmatter: ${rel}`);
    return null;
  }
  if (!fm.name) run.errors.push(`Missing name in frontmatter: ${rel}`);
  if (!fm.description) run.errors.push(`Missing description in frontmatter: ${rel}`);
  if (fm.name && fm.name !== expected)
    run.errors.push(`Name mismatch: ${rel} frontmatter name="${fm.name}" but ${shown}`);
  return fm;
}

/** One SKILL.md: frontmatter, kebab-case name, token budget. True when it counts as a skill. */
async function checkSkill(run, skillDir, rel, skillName) {
  const text = await readText(join(skillDir, "SKILL.md"));
  if (text === null) {
    run.errors.push(`Missing SKILL.md: ${rel}`);
    return false;
  }

  const fm = checkFrontmatter(run, text, rel, skillName, `directory="${skillName}"`);
  if (!fm) return false;
  if (fm.name && !/^[a-z][a-z0-9-]{0,63}$/.test(fm.name))
    run.errors.push(
      `Invalid name "${fm.name}" in ${rel} (must be kebab-case, start with a letter, <=64 chars)`,
    );

  const words = text.split(/\s+/).filter(Boolean).length;
  if (words > 3750)
    run.errors.push(
      `Token budget exceeded: ${rel} is ${words} words (5K-token limit ~= 3750 words)`,
    );
  else if (words > 3375)
    run.warnings.push(`Approaching token limit: ${rel} is ${words} words (limit 3750)`);
  return true;
}

/** @param {Run} run */
async function checkSkills(run) {
  const known = new Set();
  for (const plugin of await listDir(run.pluginsDir)) {
    const skillsDir = join(run.pluginsDir, plugin, "skills");
    for (const skillName of await listDir(skillsDir)) {
      const skillDir = join(skillsDir, skillName);
      if (!(await stat(skillDir)).isDirectory()) continue;
      const rel = `plugins/${plugin}/skills/${skillName}/SKILL.md`;
      if (await checkSkill(run, skillDir, rel, skillName)) known.add(skillName);
    }
  }
  return known;
}

/** One command file: frontmatter, and every `Skill("X")` in its prose resolves. */
function checkCommand(run, text, rel, file, knownSkills) {
  if (!checkFrontmatter(run, text, rel, file.replace(/\.md$/, ""), `file="${file}"`)) return;

  // Strip fenced code blocks and inline code spans before scanning:
  // those are illustrative documentation, not operative skill loads.
  const prose = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
  for (const match of prose.matchAll(/Skill\(["'](?<ref>[^"']+)["']\)/g)) {
    const ref = String(match.groups?.ref);
    // `plugin:skill` → `skill` (the second segment); a bare name is the skill itself
    const [first, second] = ref.split(":");
    const skillName = String(second ?? first);
    if (!knownSkills.has(skillName)) run.errors.push(`Unknown Skill("${ref}") in ${rel}`);
  }
}

/** @param {Run} run @param {Set<string>} knownSkills */
async function checkCommands(run, knownSkills) {
  for (const plugin of await listDir(run.pluginsDir)) {
    const cmdDir = join(run.pluginsDir, plugin, "commands");
    for (const file of await listDir(cmdDir)) {
      if (!file.endsWith(".md")) continue;
      const text = await readFile(join(cmdDir, file), "utf8");
      checkCommand(run, text, `plugins/${plugin}/commands/${file}`, file, knownSkills);
    }
  }
}

// Rules invariants:
//  1. No frontmatter. Rules load unconditionally, so `description`/`globs` (the
//     Cursor .mdc conditional-attach convention) have no effect and are forbidden.
//     A rule file MUST be plain markdown and MUST never start with `---`.
//  2. No drift. plugins/<plugin>/rules/ is canonical; .claude/rules/ mirrors the
//     shared rules so agents working IN this repo get the same governance the plugin
//     ships. Compare SAME-NAMED files only; .claude/rules/ also holds repo-dev-only
//     rules (marketplace, plugin-structure, etc.) absent from the plugin; those are
//     intentional, not drift. Never require the two dirs to be identical.

/** (1) Frontmatter ban for one rules dir. */
async function checkRuleFrontmatter(run, prefix, dir) {
  for (const file of await listDir(dir)) {
    if (!file.endsWith(".md")) continue;
    const text = await readFile(join(dir, file), "utf8");
    if (text.startsWith("---"))
      run.errors.push(
        `Rule has frontmatter: ${prefix || ".claude/"}rules/${file}: rules MUST be plain markdown (no description/globs; they load unconditionally)`,
      );
  }
}

/** (2) Same-named drift check for one plugin's rules, plugin canonical. */
async function checkRuleMirrors(run, plugin) {
  const pluginRulesDir = join(run.pluginsDir, plugin, "rules");
  for (const file of await listDir(pluginRulesDir)) {
    if (!file.endsWith(".md")) continue;
    const canonical = await readFile(join(pluginRulesDir, file), "utf8");
    const rel = `.claude/rules/${file}`;
    const mirror = await readText(join(run.rulesDir, file));
    if (mirror === null)
      run.errors.push(`Missing rule mirror: ${rel} (canonical: plugins/${plugin}/rules/${file})`);
    else if (mirror !== canonical)
      run.errors.push(
        `Rule drift: ${rel} differs from canonical plugins/${plugin}/rules/${file} (copy plugin→repo)`,
      );
  }
}

/** @param {Run} run */
async function checkRules(run) {
  // No plugins/ means nothing to mirror: skip the rules checks entirely
  const pluginsDir = await stat(run.pluginsDir).catch(() => null);
  if (!pluginsDir?.isDirectory()) return;
  const plugins = await listDir(run.pluginsDir);
  await checkRuleFrontmatter(run, "", run.rulesDir);
  for (const plugin of plugins)
    await checkRuleFrontmatter(run, `plugins/${plugin}/`, join(run.pluginsDir, plugin, "rules"));
  for (const plugin of plugins) await checkRuleMirrors(run, plugin);
}

/** @param {Run} run */
async function checkClaudeMd(run) {
  for (const rel of [".claude/CLAUDE.md"]) {
    const text = await readText(join(run.root, rel));
    if (text === null) continue;
    const lines = text.split("\n").length;
    if (lines > 200) run.errors.push(`${rel} is ${lines} lines (Claude Code limit is 200)`);
    else if (lines > 180) run.warnings.push(`${rel} is ${lines} lines (approaching 200 limit)`);
  }
}

/**
 * Validate the repo at `root`.
 * @param {string} root
 * @returns {Promise<{ errors: string[], warnings: string[], skillCount: number }>}
 */
export async function validate(root) {
  /** @type {Run} */
  const run = {
    root,
    pluginsDir: join(root, "plugins"),
    rulesDir: join(root, ".claude/rules"),
    errors: [],
    warnings: [],
  };
  await checkVersions(run);
  const skills = await checkSkills(run);
  await checkCommands(run, skills);
  await checkRules(run);
  await checkClaudeMd(run);
  return { errors: run.errors, warnings: run.warnings, skillCount: skills.size };
}

/**
 * The report `pnpm validate` prints, and its exit code.
 * @param {{ errors: string[], warnings: string[], skillCount: number }} result
 */
export function report({ errors, warnings, skillCount }) {
  const lines = [];
  if (warnings.length) {
    lines.push(`WARN (${warnings.length}):`, ...warnings.map((w) => `  - ${w}`), "");
  }
  if (errors.length) {
    lines.push(`FAIL (${errors.length}):`, ...errors.map((e) => `  - ${e}`));
    return { text: lines.join("\n"), exitCode: 1 };
  }
  lines.push(`PASS: ${skillCount} skill(s) validated`);
  return { text: lines.join("\n"), exitCode: 0 };
}

// Run only when executed directly, not when imported by the tests. Node resolves symlinks for
// import.meta.url, so resolve argv[1] too, or a run through a symlink would silently validate nothing
if (import.meta.url === pathToFileURL(realpathSync(String(process.argv[1]))).href) {
  const { text, exitCode } = report(await validate(process.cwd()));
  console.log(text);
  process.exitCode = exitCode;
}
