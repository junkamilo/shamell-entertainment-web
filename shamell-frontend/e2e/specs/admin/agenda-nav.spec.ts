import { test, expect } from "@playwright/test";
import {
  AGENDA_BOX_OFFICE_PATH,
  AGENDA_DISPONIBILIDAD_PATH,
  AGENDA_HUB_PATH,
  AGENDA_MI_AGENDA_PATH,
  AGENDA_PAYMENT_HISTORY_PATH,
  AGENDA_PETICIONES_PATH,
  AGENDAR_PATH,
} from "../../constants";

const HUB_CARDS: { link: string; path: string; heading: string }[] = [
  { link: "Book", path: AGENDAR_PATH, heading: "Book" },
  { link: "Box office", path: AGENDA_BOX_OFFICE_PATH, heading: "Box office" },
  {
    link: "Availability",
    path: AGENDA_DISPONIBILIDAD_PATH,
    heading: "Availability",
  },
  { link: "Inbox", path: AGENDA_PETICIONES_PATH, heading: "Inbox" },
  {
    link: "Payment history",
    path: AGENDA_PAYMENT_HISTORY_PATH,
    heading: "Payment history",
  },
  { link: "My calendar", path: AGENDA_MI_AGENDA_PATH, heading: "My calendar" },
];

test.describe("Agenda hub navigation", () => {
  test.beforeEach(() => {
    test.skip(
      !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
      "Requires E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD",
    );
  });

  test("navigates all six hub cards to their page headings", async ({
    page,
  }) => {
    await page.route("**/api/v1/**", async (route) => {
      const url = route.request().url();
      if (url.includes("/auth/")) {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [],
          events: [],
          weekly: [],
          closures: [],
          meta: {
            page: 1,
            perPage: 10,
            totalItems: 0,
            totalPages: 0,
            hasPrev: false,
            hasNext: false,
          },
          count: 0,
          peticionesBadge: 0,
          paymentHistoryBadge: 0,
        }),
      });
    });

    for (const card of HUB_CARDS) {
      await page.goto(AGENDA_HUB_PATH);
      await expect(page.getByRole("link", { name: card.link })).toBeVisible({
        timeout: 20_000,
      });
      await page.getByRole("link", { name: card.link }).click();
      await expect(page).toHaveURL(new RegExp(card.path.replace(/\//g, "\\/")));
      await expect(
        page.getByRole("heading", { name: card.heading }),
      ).toBeVisible({ timeout: 15_000 });
    }
  });
});
