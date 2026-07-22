import { test, expect } from "@playwright/test";
import { AGENDAR_PATH } from "./e2eConstants";

test.describe("Agendar — class enrollment flow", () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
      "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD",
    );
  });

  test.skip(
    !process.env.E2E_CLASS_EVENT_ID,
    "Set E2E_CLASS_EVENT_ID to run cash enrollment against a seeded bookable event",
  );

  test("can open class tab with bookable events list", async ({ page }) => {
    await page.goto(`${AGENDAR_PATH}?mode=class`);
    await expect(page.getByTestId("agendar-class-panel")).toBeVisible({ timeout: 20_000 });
  });
});
