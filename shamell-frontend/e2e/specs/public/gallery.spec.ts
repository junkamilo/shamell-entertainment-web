import { test, expect } from "@playwright/test";

test.describe("Gallery", () => {
  test("renders GALLERY heading and filter updates URL", async ({ page }) => {
    await page.route("**/api/v1/gallery/categories**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "c1", name: "Fire", slug: "fire", isActive: true },
        ]),
      });
    });
    await page.route("**/api/v1/gallery/photos**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [] }),
      });
    });

    await page.goto("/gallery");
    await expect(page.getByRole("heading", { name: "GALLERY" })).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole("link", { name: "Fire" }).click();
    await expect(page).toHaveURL(/filter=fire/);
  });
});
