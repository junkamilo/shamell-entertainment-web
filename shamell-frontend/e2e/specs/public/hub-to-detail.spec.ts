import { test, expect } from "@playwright/test";
import {
  E2E_HUB_TICKET_SLUG,
  E2E_SEATS_SLUG,
  hubSeatingEvent,
  hubTicketEvent,
  mockPublicNoiseApis,
  mockUpcomingEventDetail,
  seatsEventDetail,
  ticketEventDetail,
} from "../../fixtures/event-detail";

test.describe("Hub to detail / seats", () => {
  test.beforeEach(async ({ page }) => {
    await mockPublicNoiseApis(page);
  });

  test("ticket hub CTA opens event detail", async ({ page }) => {
    const hub = hubTicketEvent();
    await page.route("**/api/v1/events?**", async (route) => {
      const url = route.request().url();
      if (!url.includes("publicSection=UPCOMING_EVENTS")) {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: hub.id,
            slug: hub.slug,
            eventTypeName: hub.eventTypeName,
            description: hub.description,
            items: hub.items,
            experienceType: hub.experienceType,
            purchaseMode: hub.purchaseMode,
            purchasable: true,
            ticketsRemaining: hub.ticketsRemaining,
            fixedTicketCapacity: hub.fixedTicketCapacity,
          },
        ]),
      });
    });
    await mockUpcomingEventDetail(page, E2E_HUB_TICKET_SLUG, {
      ...ticketEventDetail(),
      slug: E2E_HUB_TICKET_SLUG,
      eventTypeName: "Hub Ticket Night",
    });

    await page.goto("/on-coming-events");
    await expect(
      page.getByRole("heading", { name: "ON COMING EVENTS" }),
    ).toBeVisible({ timeout: 20_000 });
    await page.getByRole("link", { name: "Buy ticket" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/on-coming-events/${E2E_HUB_TICKET_SLUG}`),
    );
    await expect(
      page.getByRole("heading", { name: "Hub Ticket Night" }),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("seating hub CTA opens seats page", async ({ page }) => {
    const hub = hubSeatingEvent();
    await page.route("**/api/v1/events?**", async (route) => {
      const url = route.request().url();
      if (!url.includes("publicSection=UPCOMING_EVENTS")) {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: hub.id,
            slug: hub.slug,
            eventTypeName: hub.eventTypeName,
            description: hub.description,
            items: hub.items,
            experienceType: hub.experienceType,
            purchaseMode: hub.purchaseMode,
            purchasable: true,
            tablesRemaining: hub.tablesRemaining,
            tableCapacity: hub.tableCapacity,
          },
        ]),
      });
    });
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
              description: "Hub to seats",
              items: ["Tables"],
            },
            config: {
              reservationEventLabel: "Seating Gala",
              reservationEventDate: "2030-08-01T20:00:00.000Z",
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
          sceneZones: {},
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
        body: JSON.stringify({
          availableQuantity: 0,
          unitPrice: 0,
        }),
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
          }),
        });
      },
    );

    await page.goto("/on-coming-events");
    await page.getByRole("link", { name: "Buy tables / seats" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/on-coming-events/${E2E_SEATS_SLUG}/seats`),
    );
  });
});
