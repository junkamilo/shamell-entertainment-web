import { test, expect } from "@playwright/test";

test.describe("Contacto deep-link", () => {
  test("mode=booking and serviceType skip gate into wizard", async ({
    page,
  }) => {
    await page.route("**/api/v1/contact/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ lines: [], items: [] }),
      });
    });
    await page.route("**/api/v1/events/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.route("**/api/v1/services/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.goto("/contacto?mode=booking&serviceType=VIP_EVENT");

    await expect(
      page.getByRole("navigation", { name: "Form progress" }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole("heading", { name: "How clear is your vision?" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Submit inquiry" }),
    ).toHaveCount(0);
  });
});
