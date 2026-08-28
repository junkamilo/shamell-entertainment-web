import { test, expect } from "@playwright/test";
import { CONTACTO_PATH } from "../../constants";

test.describe("Contacto wizard", () => {
  test("opens booking inquiry from gate without reaching submit", async ({
    page,
  }) => {
    await page.goto(CONTACTO_PATH);

    await expect(
      page.getByRole("heading", { name: "How clear is your vision?" }),
    ).toBeVisible({ timeout: 20_000 });

    await page.getByRole("link", { name: "Start booking inquiry" }).click();

    await expect(
      page.getByRole("navigation", { name: "Form progress" }),
    ).toBeVisible({ timeout: 20_000 });

    await expect(
      page.getByRole("button", { name: "Submit inquiry" }),
    ).toHaveCount(0);
  });
});
