import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Claude Design export: reference markup plus the viewer runtime it needs
    // to open in a browser. Not ours, never imported, never bundled — linting
    // it only ever reports other people's style choices.
    "design/**",
  ]),
]);

export default eslintConfig;
