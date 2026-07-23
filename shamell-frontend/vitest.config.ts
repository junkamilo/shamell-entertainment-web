import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{spec.ts,spec.tsx}"],
    exclude: ["**/tests/e2e/**", "node_modules/**"],
    environmentMatchGlobs: [["**/*.spec.tsx", "jsdom"]],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
