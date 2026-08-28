import { test, expect } from "@playwright/test";

test.describe("Forgot password", () => {
  test("submits email and shows success message", async ({ page }) => {
    await page.route("**/api/v1/auth/forgot-password", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          message:
            "If this email exists, a secure recovery link has been sent.",
        }),
      });
    });

    await page.goto("/forgot-password");
    await expect(
      page.getByRole("heading", { name: "Reset your password" }),
    ).toBeVisible();
    await page.getByLabel("Email").fill("admin@example.com");
    await page.getByRole("button", { name: "Send recovery link" }).click();
    await expect(
      page.getByText(/secure recovery link has been sent/i),
    ).toBeVisible({ timeout: 15_000 });
  });
});
