import { describe, it, expect, vi, afterEach } from "vitest";
import os from "node:os";
import path from "node:path";

describe("paths", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getSkillsDir", () => {
    it("returns user-scope path under home directory", async () => {
      const { getSkillsDir } = await import("../src/utils/paths.js");
      const result = getSkillsDir("user");
      expect(result).toBe(path.join(os.homedir(), ".claude", "skills"));
    });

    it("returns project-scope path under cwd", async () => {
      const { getSkillsDir } = await import("../src/utils/paths.js");
      const result = getSkillsDir("project");
      expect(result).toBe(path.join(process.cwd(), ".claude", "skills"));
    });
  });

  describe("getBundledSkillsDir", () => {
    it("returns skills dir relative to module", async () => {
      const { getBundledSkillsDir } = await import("../src/utils/paths.js");
      const result = getBundledSkillsDir();
      expect(result).toContain("skills");
    });
  });
});
