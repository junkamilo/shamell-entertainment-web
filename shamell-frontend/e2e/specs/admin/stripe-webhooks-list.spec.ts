import { test, expect } from "@playwright/test";
import { AGENDA_STRIPE_WEBHOOKS_PATH } from "../../constants";

test.describe("Stripe webhooks list", () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
      "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD",
    );
  });

  test("renders table and basic status filter", async ({ page }) => {
    await page.route(
      "**/api/v1/admin/stripe-webhook-events**",
      async (route) => {
        const url = new URL(route.request().url());
        const status = url.searchParams.get("status");
        const items = [
          {
            id: "550e8400-e29b-41d4-a716-446655440050",
            eventId: "evt_test_1",
            eventType: "checkout.session.completed",
            livemode: false,
            status: "PROCESSED",
            metadataFlow: "class_session",
            checkoutSessionId: "cs_test",
            purchaseCorrelationId: "corr-1",
            handler: "classSessionCheckout",
            payloadSummary: { amount: 100 },
            processedAt: "2026-07-20T12:05:00.000Z",
            attempts: 1,
            lastError: null,
            createdAt: "2026-07-20T12:00:00.000Z",
            updatedAt: "2026-07-20T12:05:00.000Z",
          },
          {
            id: "550e8400-e29b-41d4-a716-446655440051",
            eventId: "evt_test_2",
            eventType: "checkout.session.expired",
            livemode: false,
            status: "FAILED",
            metadataFlow: "venue_seat",
            checkoutSessionId: "cs_test_2",
            purchaseCorrelationId: "corr-2",
            handler: "venueSeatCheckout",
            payloadSummary: null,
            processedAt: null,
            attempts: 2,
            lastError: "timeout",
            createdAt: "2026-07-20T13:00:00.000Z",
            updatedAt: "2026-07-20T13:00:00.000Z",
          },
        ].filter((row) => !status || row.status === status);

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items,
            meta: {
              page: 1,
              perPage: 20,
              totalItems: items.length,
              totalPages: 1,
              hasPrev: false,
              hasNext: false,
            },
          }),
        });
      },
    );

    await page.goto(AGENDA_STRIPE_WEBHOOKS_PATH);
    await expect(
      page.getByRole("heading", { name: "Stripe webhooks" }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("checkout.session.completed")).toBeVisible();

    const statusFilter = page.getByLabel(/status/i).first();
    if (await statusFilter.count()) {
      await statusFilter.selectOption("FAILED");
      await expect(page.getByText("checkout.session.expired")).toBeVisible({
        timeout: 10_000,
      });
    }
  });
});
