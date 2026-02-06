import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import path from "node:path";

vi.mock("../src/utils/paths.js", () => ({
  getBundledSkillsDir: vi.fn(),
  getSkillsDir: vi.fn(),
}));

describe("registry", () => {
  let tmpDir: string;

  beforeEach(async () => {
    const fs = await import("fs-extra");
    const os = await import("node:os");
    tmpDir = path.join(os.default.tmpdir(), `augur-test-${Date.now()}`);
    await fs.default.ensureDir(tmpDir);

    const { getBundledSkillsDir } = await import("../src/utils/paths.js");
    vi.mocked(getBundledSkillsDir).mockReturnValue(tmpDir);
  });

  afterEach(async () => {
    const fs = await import("fs-extra");
    await fs.default.remove(tmpDir);
    vi.restoreAllMocks();
  });

  it("returns empty array when skills dir does not exist", async () => {
    const fs = await import("fs-extra");
    await fs.default.remove(tmpDir);

    const { getRegistry } = await import("../src/registry.js");
    const result = await getRegistry();
    expect(result).toEqual([]);
  });

  it("returns empty array when skills dir is empty", async () => {
    const { getRegistry } = await import("../src/registry.js");
    const result = await getRegistry();
    expect(result).toEqual([]);
  });

  it("discovers skills in plugin directories", async () => {
    const fs = await import("fs-extra");
    const skillDir = path.join(tmpDir, "web-quality", "accessibility");
    await fs.default.ensureDir(skillDir);
    await fs.default.writeFile(
      path.join(skillDir, "SKILL.md"),
      "---\nname: accessibility\n---\n# Accessibility",
    );

    const { getRegistry } = await import("../src/registry.js");
    const result = await getRegistry();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      plugin: "web-quality",
      skill: "accessibility",
      name: "web-quality:accessibility",
      sourcePath: skillDir,
    });
  });

  it("skips files in plugin directory (non-directories)", async () => {
    const fs = await import("fs-extra");
    await fs.default.writeFile(path.join(tmpDir, "README.md"), "# Readme");

    const { getRegistry } = await import("../src/registry.js");
    const result = await getRegistry();
    expect(result).toEqual([]);
  });

  it("skips skill directories without SKILL.md", async () => {
    const fs = await import("fs-extra");
    const skillDir = path.join(tmpDir, "web-quality", "incomplete");
    await fs.default.ensureDir(skillDir);

    const { getRegistry } = await import("../src/registry.js");
    const result = await getRegistry();
    expect(result).toEqual([]);
  });

  it("skips non-directory entries inside plugin dirs", async () => {
    const fs = await import("fs-extra");
    const pluginDir = path.join(tmpDir, "my-plugin");
    await fs.default.ensureDir(pluginDir);
    await fs.default.writeFile(path.join(pluginDir, "notes.txt"), "notes");

    const { getRegistry } = await import("../src/registry.js");
    const result = await getRegistry();
    expect(result).toEqual([]);
  });

  it("discovers multiple skills across multiple plugins", async () => {
    const fs = await import("fs-extra");

    const s1 = path.join(tmpDir, "plugin-a", "skill-1");
    const s2 = path.join(tmpDir, "plugin-a", "skill-2");
    const s3 = path.join(tmpDir, "plugin-b", "skill-3");

    await fs.default.ensureDir(s1);
    await fs.default.ensureDir(s2);
    await fs.default.ensureDir(s3);

    await fs.default.writeFile(path.join(s1, "SKILL.md"), "---\nname: skill-1\n---");
    await fs.default.writeFile(path.join(s2, "SKILL.md"), "---\nname: skill-2\n---");
    await fs.default.writeFile(path.join(s3, "SKILL.md"), "---\nname: skill-3\n---");

    const { getRegistry } = await import("../src/registry.js");
    const result = await getRegistry();
    expect(result).toHaveLength(3);
  });
});

describe("filterEntries", () => {
  it("filters by plugin name", async () => {
    const { filterEntries } = await import("../src/registry.js");
    const entries = [
      { plugin: "a", skill: "s1", name: "a:s1", sourcePath: "/a/s1" },
      { plugin: "a", skill: "s2", name: "a:s2", sourcePath: "/a/s2" },
      { plugin: "b", skill: "s3", name: "b:s3", sourcePath: "/b/s3" },
    ];

    const result = filterEntries(entries, "a");
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.name)).toEqual(["a:s1", "a:s2"]);
  });

  it("filters by plugin:skill name", async () => {
    const { filterEntries } = await import("../src/registry.js");
    const entries = [
      { plugin: "a", skill: "s1", name: "a:s1", sourcePath: "/a/s1" },
      { plugin: "a", skill: "s2", name: "a:s2", sourcePath: "/a/s2" },
    ];

    const result = filterEntries(entries, "a:s2");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("a:s2");
  });

  it("returns empty when no match found", async () => {
    const { filterEntries } = await import("../src/registry.js");
    const entries = [
      { plugin: "a", skill: "s1", name: "a:s1", sourcePath: "/a/s1" },
    ];

    expect(filterEntries(entries, "b")).toEqual([]);
    expect(filterEntries(entries, "a:s2")).toEqual([]);
  });
});
