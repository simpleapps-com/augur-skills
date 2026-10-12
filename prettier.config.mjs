import augurPrettier from "@simpleapps-com/augur-config/prettier";

/** @type {import("prettier").Config} */
export default {
  ...augurPrettier,
  // No Tailwind in this repo
  plugins: [],
};
