import { test, expect } from "@playwright/test";
import { ON_COMING_EVENTS_ADMIN_PATH } from "../../constants";

test.describe("On Coming Events publish", () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
      "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD",
    );
  });

  test("toggles clientEnabled via PATCH", async ({ page }) => {
    let clientEnabled = false;
    let patchSeen = false;

    await page.route(
      "**/api/v1/on-coming-events/settings/admin**",
      async (route) => {
        const method = route.request().method();
        const url = route.request().url();

        if (method === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              settings: {
                clientEnabled,
                promoTitle: "On Coming Events",
                promoDescription: null,
                promoImageUrl: null,
                reservationEventDate: null,
                reservationEventLabel: null,
              },
            }),
          });
          return;
        }

        if (method === "PATCH" && url.includes("/enabled")) {
          const body = route.request().postDataJSON() as {
            clientEnabled?: boolean;
          };
          clientEnabled = Boolean(body.clientEnabled);
          patchSeen = true;
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              settings: { clientEnabled },
              message: clientEnabled ? "Published." : "Hidden.",
            }),
          });
          return;
        }

        if (method === "PATCH") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              settings: { clientEnabled },
            }),
          });
          return;
        }

        await route.fallback();
      },
    );

    await page.goto(ON_COMING_EVENTS_ADMIN_PATH);
    const toggle = page.getByRole("switch", {
      name: /Publish On Coming Events on client site/i,
    });
    await expect(toggle).toBeVisible({ timeout: 20_000 });
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await toggle.click();
    await expect.poll(() => patchSeen).toBe(true);
    await expect(toggle).toHaveAttribute("aria-checked", "true");
  });
});
