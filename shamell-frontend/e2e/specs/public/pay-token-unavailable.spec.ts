import { test, expect } from "@playwright/test";

test.describe("Pay token unavailable", () => {
  test("quote pay link with bad token shows Payment unavailable", async ({
    page,
  }) => {
    await page.route("**/api/v1/bookings/public/quote/checkout**", async (route) => {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({
          message: "This payment link is no longer available.",
        }),
      });
    });

    await page.goto("/pay/quote?token=bad");

    await expect(
      page.getByRole("heading", { name: "Payment unavailable" }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: /home/i })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
