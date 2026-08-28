import { test, expect } from "@playwright/test";
import { ON_COMING_EVENTS_HUB_PATH } from "../../constants";

test.describe("On coming events hub", () => {
  test("renders hub hero", async ({ page }) => {
    await page.goto(ON_COMING_EVENTS_HUB_PATH);
    await expect(
      page.getByRole("heading", { name: "ON COMING EVENTS" }),
    ).toBeVisible({ timeout: 20_000 });
  });
});
