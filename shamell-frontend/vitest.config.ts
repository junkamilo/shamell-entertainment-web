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
    // Prevent Vite/Vitest from loading ESM+CJS copies of three (R3F + app imports).
    dedupe: ["three"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      three: path.resolve(__dirname, "./node_modules/three"),
    },
  },
});
