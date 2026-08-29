import { test, expect } from "@playwright/test";
import { AGENDA_BOX_OFFICE_PATH } from "../../constants";

test.describe("Box office", () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
      "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD",
    );
  });

  test("switches fixed and classes tabs", async ({ page }) => {
    await page.route(
      "**/api/v1/upcoming-events/admin/box-office/fixed-events**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ events: [] }),
        });
      },
    );
    await page.route(
      "**/api/v1/upcoming-events/admin/bookable-class-events**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ events: [] }),
        });
      },
    );

    await page.goto(AGENDA_BOX_OFFICE_PATH);
    await expect(
      page.getByRole("heading", { name: "Box office" }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("box-office-tab-fixed")).toBeVisible();
    await expect(page.getByTestId("box-office-tab-classes")).toBeVisible();

    await page.getByTestId("box-office-tab-classes").click();
    await expect(page.getByTestId("box-office-tab-classes")).toBeVisible();

    await page.getByTestId("box-office-tab-fixed").click();
    await expect(page.getByTestId("box-office-tab-fixed")).toBeVisible();
  });
});
