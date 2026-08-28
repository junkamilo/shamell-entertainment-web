import { test, expect } from "@playwright/test";
import {
  mockClassPackagePaidStatus,
  mockClassSessionPaidStatus,
  mockFixedTicketPaidStatus,
  mockQuotePaidStatus,
  mockVenuePaidStatus,
} from "../../fixtures/session-status";

test.describe("Payment return UI", () => {
  test("venue return shows paid confirmation", async ({ page }) => {
    await mockVenuePaidStatus(page);
    await page.goto(
      "/on-coming-events/return?session_id=cs_e2e&event_slug=test",
    );
    await expect(page.getByTestId("payment-confirmation-paid")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "Reservation confirmed" }),
    ).toBeVisible();
    await expect(page.getByTestId("payment-confirmation-home")).toBeVisible();
  });

  test("class session return shows paid confirmation", async ({ page }) => {
    await mockClassSessionPaidStatus(page);
    await page.goto(
      "/on-coming-events/test-slug/classes/return?session_id=cs_e2e",
    );
    await expect(page.getByTestId("payment-confirmation-paid")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "You're booked" }),
    ).toBeVisible();
    await expect(page.getByTestId("payment-confirmation-home")).toBeVisible();
  });

  test("class package return shows paid confirmation", async ({ page }) => {
    await mockClassPackagePaidStatus(page);
    await page.goto(
      "/on-coming-events/test-slug/classes/package-return?session_id=cs_e2e",
    );
    await expect(page.getByTestId("payment-confirmation-paid")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "Package confirmed" }),
    ).toBeVisible();
    await expect(page.getByTestId("payment-confirmation-home")).toBeVisible();
  });

  test("quote return shows paid confirmation", async ({ page }) => {
    await mockQuotePaidStatus(page);
    await page.goto("/pay/quote/return?session_id=cs_e2e");
    await expect(page.getByTestId("payment-confirmation-paid")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "Payment confirmed" }),
    ).toBeVisible();
    await expect(page.getByTestId("payment-confirmation-home")).toBeVisible();
  });

  test("fixed ticket return shows paid confirmation", async ({ page }) => {
    await mockFixedTicketPaidStatus(page);
    await page.goto("/on-coming-events/test-slug/return?session_id=cs_e2e");
    await expect(page.getByTestId("payment-confirmation-paid")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "Ticket confirmed" }),
    ).toBeVisible();
    await expect(page.getByTestId("payment-confirmation-home")).toBeVisible();
  });

  test("pay class return shows paid confirmation", async ({ page }) => {
    await mockClassSessionPaidStatus(page);
    await page.goto("/pay/class/return?session_id=cs_e2e");
    await expect(page.getByTestId("payment-confirmation-paid")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "You're booked" }),
    ).toBeVisible();
    await expect(page.getByTestId("payment-confirmation-home")).toBeVisible();
  });

  test("pay venue-seat return shows paid confirmation", async ({ page }) => {
    await mockVenuePaidStatus(page);
    await page.goto("/pay/venue-seat/return?session_id=cs_e2e");
    await expect(page.getByTestId("payment-confirmation-paid")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "Reservation confirmed" }),
    ).toBeVisible();
    await expect(page.getByTestId("payment-confirmation-home")).toBeVisible();
  });

  test("return without session_id shows error panel", async ({ page }) => {
    await page.goto("/pay/quote/return");
    await expect(page.getByTestId("payment-confirmation-error")).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("heading", { name: "Something went wrong" }),
    ).toBeVisible();
  });
});
