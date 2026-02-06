import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/registry.js", () => ({
  getRegistry: vi.fn(),
}));

describe("list command", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  it("shows info message when no skills available", async () => {
    const { getRegistry } = await import("../src/registry.js");
    vi.mocked(getRegistry).mockResolvedValue([]);

    const { listCommand } = await import("../src/commands/list.js");
    await listCommand();

    expect(console.log).toHaveBeenCalled();
    const calls = vi.mocked(console.log).mock.calls.flat().join(" ");
    expect(calls).toContain("No skills available");
  });

  it("lists skills grouped by plugin", async () => {
    const { getRegistry } = await import("../src/registry.js");
    vi.mocked(getRegistry).mockResolvedValue([
      { plugin: "web-quality", skill: "accessibility", name: "web-quality:accessibility", sourcePath: "/s" },
      { plugin: "web-quality", skill: "seo", name: "web-quality:seo", sourcePath: "/s" },
      { plugin: "dev-tools", skill: "linting", name: "dev-tools:linting", sourcePath: "/s" },
    ]);

    const { listCommand } = await import("../src/commands/list.js");
    await listCommand();

    const output = vi.mocked(console.log).mock.calls.flat().join(" ");
    expect(output).toContain("web-quality");
    expect(output).toContain("dev-tools");
    expect(output).toContain("3 skill(s)");
    expect(output).toContain("2 plugin(s)");
  });
});
