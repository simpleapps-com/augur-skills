import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import path from "node:path";
import fs from "fs-extra";
import os from "node:os";

vi.mock("../src/utils/paths.js", () => ({
  getSkillsDir: vi.fn(),
  getBundledSkillsDir: vi.fn(),
}));

describe("installer", () => {
  let tmpDir: string;
  let targetDir: string;
  let sourceDir: string;

  beforeEach(async () => {
    tmpDir = path.join(os.tmpdir(), `augur-installer-test-${Date.now()}`);
    targetDir = path.join(tmpDir, "target");
    sourceDir = path.join(tmpDir, "source");
    await fs.ensureDir(targetDir);
    await fs.ensureDir(sourceDir);

    const { getSkillsDir } = await import("../src/utils/paths.js");
    vi.mocked(getSkillsDir).mockReturnValue(targetDir);
  });

  afterEach(async () => {
    await fs.remove(tmpDir);
    vi.restoreAllMocks();
  });

  describe("installSkills", () => {
    it("copies skill files to target directory", async () => {
      const skillSource = path.join(sourceDir, "my-skill");
      await fs.ensureDir(skillSource);
      await fs.writeFile(
        path.join(skillSource, "SKILL.md"),
        "---\nname: my-skill\n---\n# My Skill",
      );

      const { installSkills } = await import("../src/installer.js");
      const results = await installSkills(
        [
          {
            plugin: "test-plugin",
            skill: "my-skill",
            name: "test-plugin:my-skill",
            sourcePath: skillSource,
          },
        ],
        "user",
      );

      expect(results).toHaveLength(1);
      expect(results[0].skill).toBe("test-plugin:my-skill");
      expect(results[0].targetPath).toBe(path.join(targetDir, "my-skill"));
      expect(await fs.pathExists(path.join(targetDir, "my-skill", "SKILL.md"))).toBe(true);
    });

    it("installs multiple skills", async () => {
      const s1 = path.join(sourceDir, "s1");
      const s2 = path.join(sourceDir, "s2");
      await fs.ensureDir(s1);
      await fs.ensureDir(s2);
      await fs.writeFile(path.join(s1, "SKILL.md"), "# S1");
      await fs.writeFile(path.join(s2, "SKILL.md"), "# S2");

      const { installSkills } = await import("../src/installer.js");
      const results = await installSkills(
        [
          { plugin: "p", skill: "s1", name: "p:s1", sourcePath: s1 },
          { plugin: "p", skill: "s2", name: "p:s2", sourcePath: s2 },
        ],
        "user",
      );

      expect(results).toHaveLength(2);
    });

    it("overwrites existing skill on reinstall", async () => {
      const skillSource = path.join(sourceDir, "my-skill");
      await fs.ensureDir(skillSource);
      await fs.writeFile(path.join(skillSource, "SKILL.md"), "# v2");

      // Pre-existing skill
      const existing = path.join(targetDir, "my-skill");
      await fs.ensureDir(existing);
      await fs.writeFile(path.join(existing, "SKILL.md"), "# v1");

      const { installSkills } = await import("../src/installer.js");
      await installSkills(
        [{ plugin: "p", skill: "my-skill", name: "p:my-skill", sourcePath: skillSource }],
        "user",
      );

      const content = await fs.readFile(path.join(targetDir, "my-skill", "SKILL.md"), "utf-8");
      expect(content).toBe("# v2");
    });
  });

  describe("uninstallSkills", () => {
    it("removes skills matching plugin prefix", async () => {
      const skillDir = path.join(targetDir, "myplugin-skill");
      await fs.ensureDir(skillDir);
      await fs.writeFile(path.join(skillDir, "SKILL.md"), "---\nplugin: myplugin\n---");

      const { uninstallSkills } = await import("../src/installer.js");
      const removed = await uninstallSkills("myplugin", "user");

      expect(removed).toContain("myplugin-skill");
      expect(await fs.pathExists(skillDir)).toBe(false);
    });

    it("removes skills with plugin frontmatter reference", async () => {
      const skillDir = path.join(targetDir, "some-skill");
      await fs.ensureDir(skillDir);
      await fs.writeFile(
        path.join(skillDir, "SKILL.md"),
        "---\nname: some-skill\nplugin: web-quality\n---",
      );

      const { uninstallSkills } = await import("../src/installer.js");
      const removed = await uninstallSkills("web-quality", "user");

      expect(removed).toContain("some-skill");
    });

    it("returns empty when target dir does not exist", async () => {
      await fs.remove(targetDir);

      const { uninstallSkills } = await import("../src/installer.js");
      const removed = await uninstallSkills("nonexistent", "user");

      expect(removed).toEqual([]);
    });

    it("skips non-directory entries", async () => {
      await fs.writeFile(path.join(targetDir, "stray-file.txt"), "data");

      const { uninstallSkills } = await import("../src/installer.js");
      const removed = await uninstallSkills("stray-file", "user");

      expect(removed).toEqual([]);
    });

    it("skips directories without SKILL.md", async () => {
      const noSkill = path.join(targetDir, "myplugin-empty");
      await fs.ensureDir(noSkill);

      const { uninstallSkills } = await import("../src/installer.js");
      const removed = await uninstallSkills("myplugin", "user");

      expect(removed).toEqual([]);
    });

    it("skips skills that don't match plugin", async () => {
      const skillDir = path.join(targetDir, "other-skill");
      await fs.ensureDir(skillDir);
      await fs.writeFile(
        path.join(skillDir, "SKILL.md"),
        "---\nname: other-skill\nplugin: different\n---",
      );

      const { uninstallSkills } = await import("../src/installer.js");
      const removed = await uninstallSkills("myplugin", "user");

      expect(removed).toEqual([]);
    });
  });
});
