import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * E2E prerequisites:
 * - Frontend running (npm run build && npm run start)
 * - Public project: no backend required (session-status mocked in return specs)
 * - Admin project: backend + E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 * - Optional: PLAYWRIGHT_BASE_URL (default http://localhost:3000)
 */

const authFile = path.join(__dirname, ".auth", "admin.json");

export default defineConfig({
  testDir: path.join(__dirname),
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
      name: "public",
      testMatch: /specs[\\/]public[\\/].*\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "admin",
      testMatch: /specs[\\/]admin[\\/].*\.spec\.ts/,
      testIgnore: /specs[\\/]admin[\\/]login-ui\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: authFile,
      },
      dependencies: ["setup"],
    },
    {
      name: "admin-unauth",
      testMatch: /specs[\\/]admin[\\/]login-ui\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        // No storageState — clean context for login form validation.
      },
    },
  ],
});
