/** One plan rate limit from $.session.usage(); `kind` is Claude Code's own name for it. */
export type Limit = { kind: string; percent?: number; resetsAt?: string };

/** What the pane shows, taken from one $.session.usage() call. */
export type Reading = {
  at: number;
  cost?: number;
  contextPercent?: number;
  limits: Limit[];
  // Current model (starts the meters line) and Claude Code version (ends the first line)
  model?: string;
  version?: string;
  // GitHub login, project folder and git branch, for the line above the meters
  user?: string;
  project?: string;
  branch?: string;
  // Open issues and PRs in that GitHub repo
  issues?: number;
  prs?: number;
  // Anthropic account Claude Code is signed in as: `email (plan)`
  account?: string;
};

export type UsageSnapshot = { reading?: Reading };

declare module "claude-code" {
  interface PluginState {
    "simpleapps-statusline": { snapshot: UsageSnapshot };
  }
}
