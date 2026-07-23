import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  fetchAdminPayments,
  fetchPaymentHistoryBadge,
} from "./fetchAdminPayments";

describe("fetchAdminPayments", () => {
  it("loads a paginated payments list", async () => {
    const result = await fetchAdminPayments("token-1", {
      page: 1,
      limit: 20,
      flow: "BOOKING_QUOTE",
      status: "PAID",
      q: "ada",
    });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.meta.page).toBe(1);
  });

  it("throws when the list request fails", async () => {
    server.use(
      http.get("*/api/v1/admin/payments", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(fetchAdminPayments("token-1")).rejects.toThrow(
      /Failed to load payments/,
    );
  });
});

describe("fetchPaymentHistoryBadge", () => {
  it("returns the badge count", async () => {
    expect(await fetchPaymentHistoryBadge("token-1")).toBe(0);
    expect(await fetchPaymentHistoryBadge("token-1", 99)).toBe(2);
  });

  it("returns 0 when the payload is invalid", async () => {
    server.use(
      http.get("*/api/v1/admin/payments/badge", () =>
        HttpResponse.json({ count: "x" }),
      ),
    );
    expect(await fetchPaymentHistoryBadge("token-1", 1)).toBe(0);
  });
});
