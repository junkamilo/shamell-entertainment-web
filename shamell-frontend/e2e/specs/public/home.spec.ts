import { test, expect } from "@playwright/test";
import { HOME_PATH } from "../../constants";

test.describe("Public home", () => {
  test("loads hero with Shamell branding", async ({ page }) => {
    await page.goto(HOME_PATH);
    await expect(page.locator("#hero")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByAltText("Shamell").first()).toBeVisible();
  });
});
