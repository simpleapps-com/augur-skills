import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/registry.js", () => ({
  getRegistry: vi.fn(),
  filterEntries: vi.fn(),
}));

vi.mock("../src/installer.js", () => ({
  installSkills: vi.fn(),
}));

describe("install command", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("warns when no skills available", async () => {
    const { getRegistry } = await import("../src/registry.js");
    vi.mocked(getRegistry).mockResolvedValue([]);

    const { installCommand } = await import("../src/commands/install.js");
    await installCommand("web-quality", { scope: "user" });

    const output = vi.mocked(console.log).mock.calls.flat().join(" ");
    expect(output).toContain("No skills available");
  });

  it("errors when no matching skills found", async () => {
    const { getRegistry, filterEntries } = await import("../src/registry.js");
    vi.mocked(getRegistry).mockResolvedValue([
      { plugin: "a", skill: "s1", name: "a:s1", sourcePath: "/s" },
    ]);
    vi.mocked(filterEntries).mockReturnValue([]);

    const { installCommand } = await import("../src/commands/install.js");
    await installCommand("nonexistent", { scope: "user" });

    const output = vi.mocked(console.error).mock.calls.flat().join(" ");
    expect(output).toContain("No skills found");
  });

  it("installs matched skills and prints results", async () => {
    const entries = [
      { plugin: "p", skill: "s1", name: "p:s1", sourcePath: "/s1" },
    ];
    const { getRegistry, filterEntries } = await import("../src/registry.js");
    const { installSkills } = await import("../src/installer.js");

    vi.mocked(getRegistry).mockResolvedValue(entries);
    vi.mocked(filterEntries).mockReturnValue(entries);
    vi.mocked(installSkills).mockResolvedValue([
      { skill: "p:s1", targetPath: "/target/s1" },
    ]);

    const { installCommand } = await import("../src/commands/install.js");
    await installCommand("p", { scope: "user" });

    const output = vi.mocked(console.log).mock.calls.flat().join(" ");
    expect(output).toContain("Installed p:s1");
    expect(output).toContain("1 skill(s) installed");
  });
});
