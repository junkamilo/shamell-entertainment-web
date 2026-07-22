import { test, expect } from "@playwright/test";
import { AGENDAR_PATH } from "./e2eConstants";

test.describe("Agendar — class tab", () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
      "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD",
    );
  });

  test("opens BOOK CLASS panel without event catalog fetches", async ({ page }) => {
    const blockedPatterns = [
      "**/api/v1/agenda/agendar/catalog**",
      "**/api/v1/availability/public**",
    ];

    for (const pattern of blockedPatterns) {
      await page.route(pattern, async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Should not be called in class-only mode" }),
        });
      });
    }

    await page.goto(`${AGENDAR_PATH}?mode=class`);

    await expect(page.getByTestId("agendar-tab-class")).toBeVisible();
    await expect(page.getByTestId("agendar-class-panel")).toBeVisible({ timeout: 20_000 });
  });

  test("switches between BOOK and BOOK CLASS tabs", async ({ page }) => {
    await page.route("**/api/v1/agenda/agendar/catalog", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ services: [], eventTypes: [], occasions: [] }),
      });
    });

    await page.goto(AGENDAR_PATH);
    await expect(page.getByTestId("agendar-event-panel")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("agendar-tab-class").click();
    await expect(page).toHaveURL(/mode=class/);
    await expect(page.getByTestId("agendar-class-panel")).toBeVisible({ timeout: 20_000 });

    await page.getByTestId("agendar-tab-event").click();
    await expect(page).not.toHaveURL(/mode=class/);
    await expect(page.getByTestId("agendar-event-panel")).toBeVisible({ timeout: 15_000 });
  });
});
