import { test, expect } from "@playwright/test";
import { AGENDAR_PATH } from "./e2eConstants";

test.describe("Agendar — event tab", () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
      "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD",
    );
  });

  test("loads BOOK tab and aggregated catalog once", async ({ page }) => {
    const catalogRequests: string[] = [];
    await page.route("**/api/v1/agenda/agendar/catalog", async (route) => {
      catalogRequests.push(route.request().url());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          services: [{ id: "550e8400-e29b-41d4-a716-446655440001", serviceTypeName: "Fire" }],
          eventTypes: [{ id: "550e8400-e29b-41d4-a716-446655440010", name: "Corporate" }],
          occasions: [{ id: "550e8400-e29b-41d4-a716-446655440011", name: "Gala" }],
        }),
      });
    });

    await page.goto(AGENDAR_PATH);

    await expect(page.getByTestId("agendar-tab-event")).toBeVisible();
    await expect(page.getByTestId("agendar-event-panel")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Book" })).toBeVisible();

    await expect.poll(() => catalogRequests.length, { timeout: 15_000 }).toBe(1);
  });

  test("shows validation toast when submitting empty form", async ({ page }) => {
    await page.route("**/api/v1/agenda/agendar/catalog", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ services: [], eventTypes: [], occasions: [] }),
      });
    });

    await page.goto(AGENDAR_PATH);
    await expect(page.getByTestId("agendar-event-panel")).toBeVisible({ timeout: 15_000 });

    await page.getByTestId("agendar-submit").click();
    await expect(page.getByText("Required field missing: Event type.")).toBeVisible({
      timeout: 10_000,
    });
  });
});
