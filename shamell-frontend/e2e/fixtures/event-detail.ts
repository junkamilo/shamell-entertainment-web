import type { Page } from "@playwright/test";

const SECTION_ID = "550e8400-e29b-41d4-a716-446655440040";
const SESSION_ID = "550e8400-e29b-41d4-a716-446655440041";

function baseDetail(overrides: Record<string, unknown> = {}) {
  return {
    id: "550e8400-e29b-41d4-a716-446655440099",
    description: "E2E event",
    items: ["Item A"],
    price: 25,
    classVariant: null,
    heroImageUrl: null,
    heroMediaType: "IMAGE",
    schedule: null,
    hasActiveSessions: true,
    salesOpen: true,
    purchasable: true,
    sessions: [],
    monthPackage: null,
    eventStartsAt: "2030-08-01T20:00:00.000Z",
    ...overrides,
  };
}

export const E2E_SEATS_SLUG = "e2e-seats";
export const E2E_TICKET_SLUG = "e2e-ticket";
export const E2E_CLASSES_SLUG = "e2e-classes";
export const E2E_HUB_TICKET_SLUG = "e2e-hub-ticket";

export function seatsEventDetail() {
  return baseDetail({
    slug: E2E_SEATS_SLUG,
    eventTypeName: "Seating Gala",
    experienceType: "VENUE_SEATING",
    purchaseMode: "venue_seating",
    tableCapacity: 10,
    tablesRemaining: 5,
  });
}

export function ticketEventDetail() {
  return baseDetail({
    slug: E2E_TICKET_SLUG,
    eventTypeName: "Ticket Night",
    experienceType: "FIXED_TICKET",
    purchaseMode: "fixed_ticket",
    fixedTicketCapacity: 100,
    ticketsRemaining: 40,
    price: 50,
  });
}

export function classesEventDetail() {
  return baseDetail({
    slug: E2E_CLASSES_SLUG,
    eventTypeName: "Weekly Bachata",
    experienceType: "CLASSES",
    purchaseMode: "classes",
    schedule: {
      mode: "RECURRING_WEEKLY",
      timezone: "America/New_York",
      summary: "Mon · 7:00 PM–8:00 PM",
      effectiveFrom: "2030-07-01",
      weekdayLabels: ["Mon"],
      startTime: "19:00",
      endTime: "20:00",
      days: [
        {
          weekday: 1,
          label: "Monday",
          sections: [
            {
              id: SECTION_ID,
              label: "Beginner",
              startTime: "19:00",
              endTime: "20:00",
              sortOrder: 0,
            },
          ],
        },
      ],
    },
    sessions: [classSessionRow()],
    monthPackage: {
      enabled: true,
      price: 120,
      label: "August package",
      currentMonthIso: "2030-08",
      currentMonthSessionCount: 4,
      purchasable: true,
      purchasableMonths: ["2030-08", "2030-09"],
    },
  });
}

export function classSessionRow() {
  return {
    id: SESSION_ID,
    startsAt: "2030-08-04T23:00:00.000Z",
    endsAt: "2030-08-05T00:00:00.000Z",
    timezone: "America/New_York",
    capacity: 20,
    price: 25,
    currency: "usd",
    seatsRemaining: 12,
    weekday: 1,
    sectionId: SECTION_ID,
    sectionLabel: "Beginner",
    sectionStartTime: "19:00",
    sectionEndTime: "20:00",
  };
}

export function hubTicketEvent() {
  return {
    id: "550e8400-e29b-41d4-a716-446655440098",
    slug: E2E_HUB_TICKET_SLUG,
    eventTypeName: "Hub Ticket Night",
    description: "Hub card to detail",
    items: ["Show"],
    heroImageUrl: null,
    heroMediaType: "IMAGE",
    experienceType: "FIXED_TICKET",
    purchaseMode: "fixed_ticket",
    purchasable: true,
    ticketsRemaining: 20,
    fixedTicketCapacity: 50,
  };
}

export function hubSeatingEvent() {
  return {
    id: "550e8400-e29b-41d4-a716-446655440097",
    slug: E2E_SEATS_SLUG,
    eventTypeName: "Seating Gala",
    description: "Hub to seats",
    items: ["Tables"],
    heroImageUrl: null,
    heroMediaType: "IMAGE",
    experienceType: "VENUE_SEATING",
    purchaseMode: "venue_seating",
    purchasable: true,
    tablesRemaining: 5,
    tableCapacity: 10,
  };
}

/** Soft-stub noisy public APIs so detail/hub pages do not hang. */
export async function mockPublicNoiseApis(page: Page): Promise<void> {
  await page.route("**/api/v1/on-coming-events/settings**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        clientEnabled: true,
        promoTitle: "On Coming Events",
        promoDescription: null,
        promoImageUrl: null,
      }),
    });
  });
  await page.route("**/api/v1/venue-layout/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ clientEnabled: true }),
    });
  });
}

export async function mockUpcomingEventDetail(
  page: Page,
  slug: string,
  body: unknown,
): Promise<void> {
  await page.route("**/api/v1/upcoming-events/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace(/\/$/, "");
    const suffix = `/api/v1/upcoming-events/${slug}`;
    if (path !== suffix && !path.endsWith(suffix)) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}
