import { test, expect } from "@playwright/test";
import { AGENDA_PETICIONES_PATH, FIXTURE_BOOKING_ID } from "../../constants";

const BOOKING_ID = FIXTURE_BOOKING_ID;

function bookingRow() {
  return {
    origin: "BOOKING_ADMIN",
    id: BOOKING_ID,
    createdAt: "2026-07-20T12:00:00.000Z",
    status: "PENDING",
    booking: {
      id: BOOKING_ID,
      createdAt: "2026-07-20T12:00:00.000Z",
      contactRequestId: null,
      eventDate: "2026-08-15T20:00:00.000Z",
      location: "Studio A",
      status: "PENDING",
      source: "ADMIN_PHONE",
      notes: null,
      bookingDetails: null,
      guestFullName: "Ada Guest",
      guestEmail: "ada@example.com",
      guestPhone: "555-0100",
      guestCount: 2,
      user: null,
      service: {
        id: "550e8400-e29b-41d4-a716-446655440021",
        serviceType: { name: "Performance" },
      },
      eventType: {
        id: "550e8400-e29b-41d4-a716-446655440022",
        name: "Private event",
      },
      occasionType: null,
      event: null,
      quoteModel: null,
      quoteTotalAmount: null,
      quoteDepositAmount: null,
      quoteBalanceAmount: null,
      quoteSentAt: null,
      depositPaidAt: null,
      balancePaidAt: null,
    },
    linkedContact: null,
  };
}

test.describe("Peticiones inbox", () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
      "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD",
    );
  });

  test("shows lanes, expands card, opens Send payment link modal", async ({
    page,
  }) => {
    await page.route("**/api/v1/contact/peticiones**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [bookingRow()],
          meta: {
            page: 1,
            perPage: 10,
            totalItems: 1,
            totalPages: 1,
            hasPrev: false,
            hasNext: false,
          },
        }),
      });
    });
    await page.route("**/api/v1/services/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.route("**/api/v1/events/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.route("**/api/v1/contact/**", async (route) => {
      if (route.request().url().includes("peticiones")) {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    let quotePosted = false;
    await page.route(
      `**/api/v1/bookings/admin/${BOOKING_ID}/quote`,
      async (route) => {
        quotePosted = true;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ ok: true }),
        });
      },
    );

    await page.goto(AGENDA_PETICIONES_PATH);
    await expect(page.getByRole("heading", { name: "Inbox" })).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      page.getByRole("button", { name: /BOOKINGS & REQUESTS/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /GUIDANCE/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /PRIVATE CLASSES/i }),
    ).toBeVisible();

    await page.getByText("Ada Guest").first().click();
    await expect(
      page.getByRole("button", { name: "Send payment link" }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole("button", { name: "Send payment link" }).click();
    await expect(
      page.getByRole("dialog", { name: "Send payment link" }),
    ).toBeVisible();

    await page
      .getByRole("dialog", { name: "Send payment link" })
      .getByRole("button", { name: /^Send payment link$/i })
      .click();
    await expect.poll(() => quotePosted).toBe(true);
  });
});
