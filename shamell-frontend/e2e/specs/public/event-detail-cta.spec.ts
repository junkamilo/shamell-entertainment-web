import { test, expect } from "@playwright/test";
import {
  classesEventDetail,
  E2E_CLASSES_SLUG,
  E2E_SEATS_SLUG,
  E2E_TICKET_SLUG,
  mockPublicNoiseApis,
  mockUpcomingEventDetail,
  seatsEventDetail,
  ticketEventDetail,
} from "../../fixtures/event-detail";

test.describe("Event detail purchase CTAs", () => {
  test.beforeEach(async ({ page }) => {
    await mockPublicNoiseApis(page);
  });

  test("venue seating CTA navigates to seats", async ({ page }) => {
    await mockUpcomingEventDetail(page, E2E_SEATS_SLUG, seatsEventDetail());
    await page.goto(`/on-coming-events/${E2E_SEATS_SLUG}`);

    await expect(
      page.getByRole("heading", { name: "Seating Gala" }),
    ).toBeVisible({ timeout: 20_000 });
    const purchase = page.getByRole("region", { name: "Purchase actions" });
    await expect(purchase).toBeVisible();
    await purchase.getByRole("button", { name: "Choose your seat" }).click();
    await expect(page).toHaveURL(
      new RegExp(`/on-coming-events/${E2E_SEATS_SLUG}/seats`),
    );
  });

  test("fixed ticket CTA opens buy ticket modal", async ({ page }) => {
    await mockUpcomingEventDetail(page, E2E_TICKET_SLUG, ticketEventDetail());
    await page.goto(`/on-coming-events/${E2E_TICKET_SLUG}`);

    await expect(
      page.getByRole("heading", { name: "Ticket Night" }),
    ).toBeVisible({ timeout: 20_000 });
    await page
      .getByRole("region", { name: "Purchase actions" })
      .getByRole("button", { name: "Buy ticket" })
      .click();
    await expect(
      page.getByRole("heading", { name: "BUY TICKET" }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("classes month package CTA opens booking wizard", async ({ page }) => {
    await mockUpcomingEventDetail(page, E2E_CLASSES_SLUG, classesEventDetail());
    await page.goto(`/on-coming-events/${E2E_CLASSES_SLUG}`);

    await expect(
      page.getByRole("heading", { name: "Weekly Bachata" }),
    ).toBeVisible({ timeout: 20_000 });
    await page
      .getByRole("region", { name: "Purchase actions" })
      .getByRole("button", { name: "August package" })
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(dialog.getByRole("heading")).toBeVisible();
  });
});
