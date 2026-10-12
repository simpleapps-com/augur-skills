import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

import { report, validate } from "./validate.mjs";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "validate.mjs");
const VERSION = "2026.10.1";
const roots = [];

after(async () => {
  for (const root of roots) await rm(root, { recursive: true, force: true });
});

const skill = (name, body = "Does a thing.") =>
  `---\nname: ${name}\ndescription: "Use when testing"\n---\n\n${body}\n`;
const command = (name, body = "Run it.") =>
  `---\nname: ${name}\ndescription: Test command\n---\n\n${body}\n`;
const words = (count) => Array.from({ length: count }, () => "word").join(" ");

/** A valid one-plugin repo, with `files` (path → text, or null to leave out) laid over it. */
async function repo(files = {}) {
  const root = await mkdtemp(join(tmpdir(), "validate-"));
  roots.push(root);
  const base = {
    VERSION: `${VERSION}\n`,
    ".claude-plugin/marketplace.json": JSON.stringify({
      version: VERSION,
      plugins: [{ name: "demo", version: VERSION }],
    }),
    "plugins/demo/.claude-plugin/plugin.json": JSON.stringify({ name: "demo", version: VERSION }),
    "plugins/demo/skills/alpha/SKILL.md": skill("alpha"),
    "plugins/demo/commands/go.md": command("go", 'Load Skill("alpha") then Skill("demo:alpha").'),
    "plugins/demo/rules/safety.md": "# Safety\n",
    ".claude/rules/safety.md": "# Safety\n",
    ".claude/rules/repo-only.md": "# Repo only\n",
    ".claude/CLAUDE.md": "# Demo\n",
  };
  for (const [path, text] of Object.entries({ ...base, ...files })) {
    if (text === null) continue;
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), text);
  }
  return root;
}

test("a valid repo passes and counts its skills", async () => {
  const result = await validate(await repo());
  assert.deepEqual(result, { errors: [], warnings: [], skillCount: 1 });
});

test("version drift in marketplace entries and plugin.json is reported", async () => {
  const root = await repo({
    ".claude-plugin/marketplace.json": JSON.stringify({
      version: "2026.09.9",
      plugins: [{ name: "demo", version: "2026.09.9" }],
    }),
    "plugins/demo/.claude-plugin/plugin.json": JSON.stringify({ version: "1.0.0" }),
  });
  const { errors } = await validate(root);
  assert.deepEqual(errors, [
    `Version mismatch: .claude-plugin/marketplace.json (top)=2026.09.9 (VERSION=${VERSION})`,
    `Version mismatch: .claude-plugin/marketplace.json plugins[0] (demo)=2026.09.9 (VERSION=${VERSION})`,
    `Version mismatch: plugins/demo/.claude-plugin/plugin.json=1.0.0 (VERSION=${VERSION})`,
  ]);
});

test("a missing VERSION stops the version check; unreadable manifests are skipped", async () => {
  const missing = await validate(await repo({ VERSION: null }));
  assert.deepEqual(missing.errors, ["Missing VERSION file at repo root"]);

  const unreadable = await validate(
    await repo({
      ".claude-plugin/marketplace.json": "not json",
      "plugins/demo/.claude-plugin/plugin.json": null,
    }),
  );
  assert.deepEqual(unreadable.errors, []);

  const noPlugins = await validate(
    await repo({ ".claude-plugin/marketplace.json": JSON.stringify({ version: VERSION }) }),
  );
  assert.deepEqual(noPlugins.errors, []);
});

test("skill frontmatter, naming and missing files", async () => {
  const root = await repo({
    "plugins/demo/skills/no-file/README.md": "not a skill",
    "plugins/demo/skills/no-front/SKILL.md": "Just text.\n",
    "plugins/demo/skills/empty-front/SKILL.md": "---\nother: x\n---\n",
    "plugins/demo/skills/Bad_Name/SKILL.md": skill("Bad_Name"),
    "plugins/demo/skills/renamed/SKILL.md": skill("something-else"),
    "plugins/demo/skills/loose-file.md": "a file, not a skill folder",
  });
  const { errors, skillCount } = await validate(root);
  assert.deepEqual(
    errors.sort(),
    [
      'Invalid name "Bad_Name" in plugins/demo/skills/Bad_Name/SKILL.md (must be kebab-case, start with a letter, <=64 chars)',
      "Missing SKILL.md: plugins/demo/skills/no-file/SKILL.md",
      "Missing description in frontmatter: plugins/demo/skills/empty-front/SKILL.md",
      "Missing name in frontmatter: plugins/demo/skills/empty-front/SKILL.md",
      "No frontmatter: plugins/demo/skills/no-front/SKILL.md",
      'Name mismatch: plugins/demo/skills/renamed/SKILL.md frontmatter name="something-else" but directory="renamed"',
    ].sort(),
  );
  // alpha, Bad_Name, empty-front and renamed have frontmatter, so they count
  assert.equal(skillCount, 4);
});

test("the token budget warns from 3,376 words and fails above 3,750", async () => {
  const root = await repo({
    "plugins/demo/skills/near/SKILL.md": skill("near", words(3400)),
    "plugins/demo/skills/over/SKILL.md": skill("over", words(3800)),
  });
  const { errors, warnings } = await validate(root);
  assert.equal(warnings.length, 1);
  assert.match(
    warnings.join(),
    /^Approaching token limit: plugins\/demo\/skills\/near\/SKILL\.md is \d+ words/,
  );
  assert.equal(errors.length, 1);
  assert.match(errors.join(), /^Token budget exceeded: plugins\/demo\/skills\/over\/SKILL\.md/);
});

test("commands: frontmatter, name, and Skill() references outside code", async () => {
  const root = await repo({
    "plugins/demo/commands/notes.txt": "ignored, not markdown",
    "plugins/demo/commands/bare.md": "No frontmatter here.\n",
    "plugins/demo/commands/misnamed.md": command("other"),
    "plugins/demo/commands/refs.md": command(
      "refs",
      'Skill("missing") and Skill(\'demo:gone\') and Skill("demo:alpha:extra").\n\n```\nSkill("in-a-fence")\n```\n\n`Skill("inline-code")`',
    ),
  });
  const { errors } = await validate(root);
  assert.deepEqual(errors, [
    "No frontmatter: plugins/demo/commands/bare.md",
    'Name mismatch: plugins/demo/commands/misnamed.md frontmatter name="other" but file="misnamed.md"',
    'Unknown Skill("missing") in plugins/demo/commands/refs.md',
    'Unknown Skill("demo:gone") in plugins/demo/commands/refs.md',
  ]);
});

test("rules: frontmatter is banned, and the mirror must exist and match", async () => {
  const root = await repo({
    "plugins/demo/rules/notes.txt": "ignored, not markdown",
    "plugins/demo/rules/fm.md": "---\ndescription: x\n---\n",
    ".claude/rules/fm.md": "---\ndescription: x\n---\n",
    "plugins/demo/rules/unmirrored.md": "# New\n",
    ".claude/rules/safety.md": "# Safety, edited in the wrong place\n",
    ".claude/rules/readme.txt": "ignored",
  });
  const { errors } = await validate(root);
  assert.deepEqual(errors, [
    "Rule has frontmatter: .claude/rules/fm.md: rules MUST be plain markdown (no description/globs; they load unconditionally)",
    "Rule has frontmatter: plugins/demo/rules/fm.md: rules MUST be plain markdown (no description/globs; they load unconditionally)",
    "Rule drift: .claude/rules/safety.md differs from canonical plugins/demo/rules/safety.md (copy plugin→repo)",
    "Missing rule mirror: .claude/rules/unmirrored.md (canonical: plugins/demo/rules/unmirrored.md)",
  ]);
});

test("with no plugins/ folder the rules are not checked", async () => {
  const root = await repo({
    ".claude-plugin/marketplace.json": JSON.stringify({ version: VERSION }),
    "plugins/demo/.claude-plugin/plugin.json": null,
    "plugins/demo/skills/alpha/SKILL.md": null,
    "plugins/demo/commands/go.md": null,
    "plugins/demo/rules/safety.md": null,
    ".claude/rules/fm.md": "---\ndescription: x\n---\n",
  });
  assert.deepEqual(await validate(root), { errors: [], warnings: [], skillCount: 0 });
});

test("CLAUDE.md warns past 180 lines, fails past 200, and may be absent", async () => {
  const lines = (count) => Array.from({ length: count }, (_, i) => `line ${i}`).join("\n");
  const near = await validate(await repo({ ".claude/CLAUDE.md": lines(190) }));
  assert.deepEqual(near.warnings, [".claude/CLAUDE.md is 190 lines (approaching 200 limit)"]);
  const over = await validate(await repo({ ".claude/CLAUDE.md": lines(210) }));
  assert.deepEqual(over.errors, [".claude/CLAUDE.md is 210 lines (Claude Code limit is 200)"]);
  const absent = await validate(await repo({ ".claude/CLAUDE.md": null }));
  assert.deepEqual(absent.errors, []);
});

test("an empty folder reports only the missing VERSION", async () => {
  const root = await mkdtemp(join(tmpdir(), "validate-empty-"));
  roots.push(root);
  assert.deepEqual(await validate(root), {
    errors: ["Missing VERSION file at repo root"],
    warnings: [],
    skillCount: 0,
  });
});

test("report: pass, warnings, and failure with exit code 1", () => {
  assert.deepEqual(report({ errors: [], warnings: [], skillCount: 3 }), {
    text: "PASS: 3 skill(s) validated",
    exitCode: 0,
  });
  assert.deepEqual(report({ errors: [], warnings: ["w"], skillCount: 1 }), {
    text: "WARN (1):\n  - w\n\nPASS: 1 skill(s) validated",
    exitCode: 0,
  });
  assert.deepEqual(report({ errors: ["e1", "e2"], warnings: ["w"], skillCount: 1 }), {
    text: "WARN (1):\n  - w\n\nFAIL (2):\n  - e1\n  - e2",
    exitCode: 1,
  });
});

test("run directly, it prints the report and sets the exit code", async () => {
  const pass = spawnSync(process.execPath, [SCRIPT], { cwd: await repo(), encoding: "utf8" });
  assert.equal(pass.status, 0);
  assert.equal(pass.stdout, "PASS: 1 skill(s) validated\n");
  const fail = spawnSync(process.execPath, [SCRIPT], {
    cwd: await repo({ VERSION: null }),
    encoding: "utf8",
  });
  assert.equal(fail.status, 1);
  assert.equal(fail.stdout, "FAIL (1):\n  - Missing VERSION file at repo root\n");
});

test("run through a symlink, it still validates", async () => {
  const linkDir = await mkdtemp(join(tmpdir(), "validate-link-"));
  roots.push(linkDir);
  const link = join(linkDir, "validate.mjs");
  await symlink(SCRIPT, link);
  const fail = spawnSync(process.execPath, [link], {
    cwd: await repo({ VERSION: null }),
    encoding: "utf8",
  });
  assert.equal(fail.status, 1);
  assert.equal(fail.stdout, "FAIL (1):\n  - Missing VERSION file at repo root\n");
});
