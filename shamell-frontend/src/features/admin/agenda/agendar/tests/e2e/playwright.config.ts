import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * E2E prerequisites:
 * - Backend running with NEXT_PUBLIC_BACKEND_URL reachable from the browser
 * - Frontend running (npm run build && npm run start)
 * - E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD set for authenticated flows
 * - Optional: PLAYWRIGHT_BASE_URL (default http://localhost:3000)
 */

const authFile = path.join(__dirname, ".auth", "admin.json");

export default defineConfig({
  testDir: path.join(__dirname),
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
});
