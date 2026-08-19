import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    // `.claude/worktrees/` holds full copies of the repo from other sessions. Vitest
    // was collecting their test files too, so every run reported failures from stale
    // code — identical before and after any change, which made the suite useless as a
    // signal. `workshop-helper` is its own package with its own tests.
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      ".claude/worktrees/**",
      "workshop-helper/**",
      ".eve/**",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
