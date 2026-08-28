import { test, expect } from "@playwright/test";
import {
  E2E_SEATS_SLUG,
  mockPublicNoiseApis,
  mockUpcomingEventDetail,
  seatsEventDetail,
} from "../../fixtures/event-detail";

test.describe("Seats page chrome", () => {
  test("loads seats page hero without 3D interaction", async ({ page }) => {
    await mockPublicNoiseApis(page);
    await mockUpcomingEventDetail(page, E2E_SEATS_SLUG, seatsEventDetail());
    await page.route(
      `**/api/v1/upcoming-events/${E2E_SEATS_SLUG}/venue**`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            event: {
              eventTypeName: "Seating Gala",
              description: "E2E event",
              items: ["Item A"],
            },
            config: {
              reservationEventLabel: "Seating Gala",
              reservationEventDate: "2030-08-01T20:00:00.000Z",
              reservationOpensAt: null,
            },
          }),
        });
      },
    );
    await page.route("**/api/v1/floor-layout**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "fl-1",
          viewBoxWidth: 614,
          viewBoxHeight: 944,
          items: [],
          sceneZones: {
            stage: { x: 0, z: -8, rotationY: 0 },
            carpet: { x: 0, z: 2, rotationY: 0 },
          },
        }),
      });
    });
    await page.route("**/api/v1/venue-tables**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });
    await page.route("**/api/v1/standalone-chairs**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ availableQuantity: 0, unitPrice: 0 }),
      });
    });
    await page.route(
      "**/api/v1/venue-reservations/availability**",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            reservationsOpen: true,
            reservedLayoutItemIds: [],
            reservedVenueTableConfigIds: [],
          }),
        });
      },
    );

    await page.goto(`/on-coming-events/${E2E_SEATS_SLUG}/seats`);
    await expect(
      page.getByRole("heading", { name: "Seating Gala" }),
    ).toBeVisible({ timeout: 25_000 });
  });
});
