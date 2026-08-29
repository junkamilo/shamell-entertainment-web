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
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{spec,test}.{ts,tsx}",
        "src/**/test/**",
        "src/test/**",
        "src/**/*.d.ts",

        // ── Boilerplate sin lógica runtime ──────────────────
        "src/app/**",                   // Next.js route wrappers (layout/page) → E2E
        "**/index.ts",                  // Barrel re-exports
        "**/*.types.ts",                // Type-only files
        "**/tests/fixtures/**",         // Test data factories
        "**/tests/helpers/**",          // Test utilities
        "**/tests/*.manifest.ts",       // Manual QA manifests

        // ── Generados / deprecated re-exports ───────────────
        "src/components/ui/**",                          // shadcn/ui generados
        "src/hooks/use-venue-layout-settings/**",        // deprecated re-export
      ],
    },
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
