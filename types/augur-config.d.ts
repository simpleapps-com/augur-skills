// @simpleapps-com/augur-config ships plain JS configs without type declarations
declare module "@simpleapps-com/augur-config/eslint" {
  const config: import("eslint").Linter.Config[];
  export default config;
}

declare module "@simpleapps-com/augur-config/prettier" {
  const config: import("prettier").Config;
  export default config;
}
