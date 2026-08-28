import { test, expect } from "@playwright/test";
import {
  classSessionRow,
  E2E_CLASSES_SLUG,
  mockPublicNoiseApis,
} from "../../fixtures/event-detail";

test.describe("Classes booking form", () => {
  test("selects session and enables Continue to payment", async ({ page }) => {
    await mockPublicNoiseApis(page);
    const session = classSessionRow();
    await page.route(
      `**/api/v1/upcoming-events/${E2E_CLASSES_SLUG}/sessions**`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            event: {
              eventTypeName: "Weekly Bachata",
              slug: E2E_CLASSES_SLUG,
              description: "Class night",
            },
            sessions: [session],
          }),
        });
      },
    );

    await page.goto(`/on-coming-events/${E2E_CLASSES_SLUG}/classes`);
    await expect(
      page.getByRole("heading", { name: "Weekly Bachata" }),
    ).toBeVisible({ timeout: 20_000 });

    await page.locator("ul button").first().click();
    await expect(
      page.getByRole("heading", { name: "YOUR DETAILS" }),
    ).toBeVisible();

    await page.getByPlaceholder("Full name").fill("Ada Lovelace");
    await page.getByPlaceholder("Email").fill("ada@example.com");

    const continueBtn = page.getByRole("button", {
      name: "Continue to payment",
    });
    await expect(continueBtn).toBeEnabled();
  });
});
