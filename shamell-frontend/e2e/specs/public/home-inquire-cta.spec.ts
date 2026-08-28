import { test, expect } from "@playwright/test";

test.describe("Home inquire CTA", () => {
  test("Inquire navigates to contacto", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#hero")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("link", { name: "Inquire" }).first().click();
    await expect(page).toHaveURL(/\/contacto/);
  });
});
