import { test, expect } from "@playwright/test";
import { ADMIN_LOGIN_PATH } from "../../constants";

test.describe("Admin login UI", () => {
  test("shows validation when submitting empty credentials", async ({
    page,
  }) => {
    await page.goto(ADMIN_LOGIN_PATH);
    await expect(
      page.getByRole("heading", { name: "Shamell admin login" }),
    ).toBeVisible({ timeout: 15_000 });

    const email = page.getByLabel("Email");
    const password = page.getByLabel("Password");
    await expect(email).toHaveAttribute("required", "");
    await expect(password).toHaveAttribute("required", "");
  });

  test("shows error for invalid credentials via mocked login", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/admin/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Invalid admin credentials." }),
      });
    });

    await page.goto(ADMIN_LOGIN_PATH);
    await page.getByLabel("Email").fill("wrong@example.com");
    await page.getByLabel("Password").fill("bad-password");
    await page.getByRole("button", { name: "Sign In as Admin" }).click();
    await expect(page.getByText("Invalid admin credentials.")).toBeVisible({
      timeout: 15_000,
    });
  });
});
