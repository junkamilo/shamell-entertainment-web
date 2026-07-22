import { test, expect } from "@playwright/test";
import { AGENDAR_PATH } from "./e2eConstants";
import { FIXTURE_BOOKING_ID } from "../fixtures/uuids.fixture";

test.describe("Agendar — edit mode", () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
      "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD",
    );
  });

  test("prefills form from booking API and hides class tab", async ({ page }) => {
    await page.route(`**/api/v1/bookings/admin/${FIXTURE_BOOKING_ID}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: FIXTURE_BOOKING_ID,
          eventDate: "2026-07-15T22:00:00.000Z",
          location: "Garden Terrace",
          status: "PENDING",
          source: "ADMIN",
          guestFullName: "Maria Garcia",
          guestEmail: "maria@example.com",
          guestPhone: "5559876543",
          guestCount: 80,
          notes: "Anniversary",
          eventType: { id: "550e8400-e29b-41d4-a716-446655440010", name: "Wedding" },
          occasionType: { id: "550e8400-e29b-41d4-a716-446655440011", name: "Reception" },
          service: { id: "550e8400-e29b-41d4-a716-446655440001" },
          bookingDetails: { eventTimeStart: "18:30", eventTimeEnd: "22:30" },
        }),
      });
    });

    await page.route("**/api/v1/agenda/agendar/catalog", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          services: [{ id: "550e8400-e29b-41d4-a716-446655440001", serviceTypeName: "Fire" }],
          eventTypes: [{ id: "550e8400-e29b-41d4-a716-446655440010", name: "Wedding" }],
          occasions: [{ id: "550e8400-e29b-41d4-a716-446655440011", name: "Reception" }],
        }),
      });
    });

    await page.goto(`${AGENDAR_PATH}?bookingId=${FIXTURE_BOOKING_ID}`);

    await expect(page.getByRole("heading", { name: "Edit booking" })).toBeVisible();
    await expect(page.getByTestId("agendar-tab-class")).toHaveCount(0);
    await expect(page.getByTestId("agendar-event-panel")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByDisplayValue("Maria Garcia")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByDisplayValue("maria@example.com")).toBeVisible();
  });
});
