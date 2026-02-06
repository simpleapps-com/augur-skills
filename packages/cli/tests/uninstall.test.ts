import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/installer.js", () => ({
  uninstallSkills: vi.fn(),
}));

describe("uninstall command", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("warns when no skills found to uninstall", async () => {
    const { uninstallSkills } = await import("../src/installer.js");
    vi.mocked(uninstallSkills).mockResolvedValue([]);

    const { uninstallCommand } = await import("../src/commands/uninstall.js");
    await uninstallCommand("nonexistent", { scope: "user" });

    const output = vi.mocked(console.log).mock.calls.flat().join(" ");
    expect(output).toContain("No installed skills found");
  });

  it("uninstalls and reports removed skills", async () => {
    const { uninstallSkills } = await import("../src/installer.js");
    vi.mocked(uninstallSkills).mockResolvedValue(["skill-a", "skill-b"]);

    const { uninstallCommand } = await import("../src/commands/uninstall.js");
    await uninstallCommand("myplugin", { scope: "project" });

    const output = vi.mocked(console.log).mock.calls.flat().join(" ");
    expect(output).toContain("Uninstalled skill-a");
    expect(output).toContain("Uninstalled skill-b");
    expect(output).toContain("2 skill(s) uninstalled");
    expect(output).toContain("project");
  });
});
