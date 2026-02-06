import path from "node:path";
import os from "node:os";

export type Scope = "user" | "project";

/** Resolve the skills target directory based on scope */
export function getSkillsDir(scope: Scope): string {
  if (scope === "user") {
    return path.join(os.homedir(), ".claude", "skills");
  }
  return path.join(process.cwd(), ".claude", "skills");
}

/** Resolve the bundled skills source directory within the CLI package */
export function getBundledSkillsDir(): string {
  // When running from dist/, skills/ is at the package root (sibling to dist/)
  return path.resolve(import.meta.dirname, "..", "skills");
}
