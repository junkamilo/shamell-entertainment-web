import { test, expect } from "@playwright/test";
import { AGENDA_PAYMENT_HISTORY_PATH } from "../../constants";

const PAYMENT_ID = "550e8400-e29b-41d4-a716-446655440030";

test.describe("Payment history", () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
      "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD",
    );
  });

  test("lists payments and opens detail", async ({ page }) => {
    await page.route("**/api/v1/admin/payments/badge**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ count: 0 }),
      });
    });
    await page.route("**/api/v1/admin/payments/**", async (route) => {
      const url = route.request().url();
      if (url.includes(`/${PAYMENT_ID}`) || url.match(/BOOKING_QUOTE\//)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: PAYMENT_ID,
            flow: "BOOKING_QUOTE",
            status: "PAID",
            stage: "FULL",
            amount: 150,
            currency: "usd",
            customerName: "Ada Lovelace",
            customerEmail: "ada@example.com",
            customerPhone: "555-0100",
            contextLabel: "Private event booking",
            bookingId: null,
            eventSlug: null,
            eventId: null,
            reservationId: null,
            stripeCheckoutSessionId: "cs_test",
            paymentMethodLabel: "Visa •••• 4242",
            createdAt: "2026-07-20T12:00:00.000Z",
            paidAt: "2026-07-20T12:05:00.000Z",
            expiresAt: null,
            updatedAt: "2026-07-20T12:05:00.000Z",
            purchaseDetails: {
              flow: "BOOKING_QUOTE",
              eventType: "Show",
              occasion: "Birthday",
              services: "Dance",
              eventDate: "2026-08-15T20:00:00.000Z",
              location: "Studio A",
              guestCount: 20,
              quoteTotalAmount: 500,
              quoteDepositAmount: 150,
              quoteModel: "DEPOSIT",
            },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: PAYMENT_ID,
              flow: "BOOKING_QUOTE",
              status: "PAID",
              stage: "FULL",
              amount: 150,
              currency: "usd",
              customerName: "Ada Lovelace",
              customerEmail: "ada@example.com",
              contextLabel: "Private event booking",
              bookingId: null,
              eventSlug: null,
              eventId: null,
              reservationId: null,
              stripeCheckoutSessionId: "cs_test",
              paymentMethodLabel: "Visa •••• 4242",
              createdAt: "2026-07-20T12:00:00.000Z",
              paidAt: "2026-07-20T12:05:00.000Z",
              expiresAt: null,
              updatedAt: "2026-07-20T12:05:00.000Z",
            },
          ],
          meta: {
            page: 1,
            perPage: 20,
            totalItems: 1,
            totalPages: 1,
            hasPrev: false,
            hasNext: false,
          },
        }),
      });
    });

    await page.goto(AGENDA_PAYMENT_HISTORY_PATH);
    await expect(
      page.getByRole("heading", { name: "Payment history" }),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Ada Lovelace").first()).toBeVisible();
    await page.getByText("Ada Lovelace").first().click();
    await expect(page.getByText(/Private event booking|Studio A/i).first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
