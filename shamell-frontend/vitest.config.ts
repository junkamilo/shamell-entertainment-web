import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./test/support/setup.ts"],
    include: [
      "src/**/*.spec.{ts,tsx}", // ← quitar cuando no quede ningún spec en src
      "test/**/*.spec.{ts,tsx}",
    ],
    exclude: ["**/node_modules/**", "**/tests/e2e/**", "e2e/**", "**/*.cy.{ts,tsx}"],
    // jsdom se activa por pragma `// @vitest-environment jsdom` en cada *.spec.tsx.
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{spec,test}.{ts,tsx}",
        "src/**/test/**",
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
      "@test": path.resolve(__dirname, "./test"),
      three: path.resolve(__dirname, "./node_modules/three"),
    },
  },
});
