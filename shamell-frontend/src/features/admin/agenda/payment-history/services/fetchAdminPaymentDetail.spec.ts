import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminPaymentDetail } from "./fetchAdminPaymentDetail";
import { FIXTURE_PAYMENT_ID } from "../test/fixtures/uuids.fixture";

describe("fetchAdminPaymentDetail", () => {
  it("loads payment detail by flow and id", async () => {
    const detail = await fetchAdminPaymentDetail(
      "token-1",
      "BOOKING_QUOTE",
      FIXTURE_PAYMENT_ID,
    );
    expect(detail.id).toBe(FIXTURE_PAYMENT_ID);
    expect(detail.customerPhone).toBe("555-0100");
  });

  it("throws when the detail request fails", async () => {
    server.use(
      http.get("*/api/v1/admin/payments/:flow/:id", () =>
        HttpResponse.json({ message: "missing" }, { status: 404 }),
      ),
    );
    await expect(
      fetchAdminPaymentDetail("token-1", "VENUE_SEAT", "missing"),
    ).rejects.toThrow(/Failed to load payment detail/);
  });
});
