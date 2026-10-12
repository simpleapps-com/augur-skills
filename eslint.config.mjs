import js from "@eslint/js";
import augurConfig from "@simpleapps-com/augur-config/eslint";
import globals from "globals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...augurConfig,
  // JS rules for the .mjs scripts only; TypeScript (mods) keeps augur-config's TS-aware rules
  { ...js.configs.recommended, files: ["**/*.mjs"] },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      // Team limit is 10; augur-config warns at 15
      complexity: ["error", 10],
      "max-depth": ["error", 4],
      "max-nested-callbacks": ["error", 3],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    // Claude Code's generated mod API types are not ours to lint
    ignores: ["node_modules/", "plugins/*/.claude-plugin/types/"],
  },
];
