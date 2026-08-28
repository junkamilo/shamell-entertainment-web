import { test, expect } from "@playwright/test";
import { AGENDA_MI_AGENDA_PATH, FIXTURE_BOOKING_ID } from "../../constants";

test.describe("My calendar", () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
      "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD",
    );
  });

  test("switches Day/Week/Month and opens event detail", async ({ page }) => {
    await page.route("**/api/v1/bookings/admin/calendar**", async (route) => {
      const url = new URL(route.request().url());
      const from = url.searchParams.get("from") ?? "2026-07-20T00:00:00.000Z";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: FIXTURE_BOOKING_ID,
              eventDate: from,
              location: "Studio A",
              status: "CONFIRMED",
              source: "ADMIN_PHONE",
              notes: "Bring shoes",
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
                name: "Private class",
              },
              occasionType: null,
              event: null,
              bookingDetails: {
                eventTimeStart: "10:00",
                eventTimeEnd: "11:30",
              },
              depositPaidAt: null,
              balancePaidAt: null,
              quoteSentAt: null,
              quoteModel: null,
            },
          ],
          from: url.searchParams.get("from"),
          to: url.searchParams.get("to"),
        }),
      });
    });

    await page.goto(AGENDA_MI_AGENDA_PATH);
    await expect(
      page.getByRole("heading", { name: "My calendar" }),
    ).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: "DAY" }).click();
    await page.getByRole("button", { name: "WEEK" }).click();
    await page.getByRole("button", { name: "MONTH" }).click();
    await page.getByRole("button", { name: "WEEK" }).click();

    await page.getByText("Ada Guest").first().click();
    await expect(page.getByText("Studio A")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("CONFIRMED")).toBeVisible();
  });
});
