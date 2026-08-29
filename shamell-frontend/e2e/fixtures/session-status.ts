import type { Page } from "@playwright/test";

const venuePaid = {
  stripeStatus: "complete",
  reservation: {
    id: "res-e2e-1",
    kind: "catalog_table",
    layoutItemId: "layout-e2e-1",
    tableName: "Large 1",
    seatDisplayLabel: "Large 1",
    status: "PAID",
    amount: 250,
    currency: "usd",
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    eventDate: "2030-08-01",
    paidAt: "2026-07-20T12:00:00.000Z",
  },
};

const classSessionPaid = {
  stripeStatus: "complete",
  enrollment: { status: "PAID" },
};

const classPackagePaid = {
  stripeStatus: "complete",
  purchaseKind: "package",
  enrollment: {
    status: "PAID",
    sessions: [
      {
        sessionLabel: "Mon 7pm Beginner",
        confirmationReference: "ABC123",
      },
    ],
  },
};

const quotePaid = {
  stripeStatus: "complete",
  paymentStatus: "PAID",
  stage: "PAID",
  amount: 150,
  currency: "usd",
  customerName: "Ada Lovelace",
  customerEmail: "ada@example.com",
};

const fixedTicketPaid = {
  stripeStatus: "complete",
  enrollment: {
    id: "fe-e2e-1",
    status: "PAID",
    ticketNumber: 42,
    customerName: "Ada Lovelace",
    customerEmail: "ada@example.com",
    eventName: "Gala Night",
    eventSlug: "test-slug",
  },
};

async function fulfillJson(
  route: {
    fulfill: (opts: {
      status: number;
      contentType: string;
      body: string;
    }) => Promise<void>;
  },
  body: unknown,
): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

export async function mockVenuePaidStatus(page: Page): Promise<void> {
  await page.route("**/api/v1/venue-reservations/session-status**", (route) =>
    fulfillJson(route, venuePaid),
  );
}

export async function mockClassSessionPaidStatus(page: Page): Promise<void> {
  await page.route("**/api/v1/class-enrollments/session-status**", (route) =>
    fulfillJson(route, classSessionPaid),
  );
}

export async function mockClassPackagePaidStatus(page: Page): Promise<void> {
  await page.route("**/api/v1/class-enrollments/session-status**", (route) =>
    fulfillJson(route, classPackagePaid),
  );
}

export async function mockQuotePaidStatus(page: Page): Promise<void> {
  await page.route(
    "**/api/v1/bookings/public/quote/session-status**",
    (route) => fulfillJson(route, quotePaid),
  );
}

export async function mockFixedTicketPaidStatus(page: Page): Promise<void> {
  await page.route(
    "**/api/v1/fixed-event-enrollments/session-status**",
    (route) => fulfillJson(route, fixedTicketPaid),
  );
}
