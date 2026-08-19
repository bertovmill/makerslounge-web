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
    // The Eve Agent Workshop's helper agent is its own package with its own
    // tsconfig and build (see `next.config.ts` → `withEve`), and `.eve/`
    // holds generated nitro output.
    "workshop-helper/**",
    ".eve/**",
  ]),
  {
    rules: {
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": ["warn", { builtinGlobals: false, hoist: "all" }],
    },
  },
]);

export default eslintConfig;
