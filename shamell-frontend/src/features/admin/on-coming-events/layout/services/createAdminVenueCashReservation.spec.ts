import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { createAdminVenueCashReservation } from "./createAdminVenueCashReservation";
import { venueCashReservationHandler } from "../../test/mocks/handlers";
import {
  FIXTURE_LAYOUT_ITEM_ID,
  FIXTURE_TABLE_CONFIG_ID,
} from "../../test/fixtures/uuids.fixture";

describe("createAdminVenueCashReservation", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns reservation details on success", async () => {
    server.use(venueCashReservationHandler());
    const result = await createAdminVenueCashReservation("token-1", {
      kind: "catalog_table",
      layoutItemId: FIXTURE_LAYOUT_ITEM_ID,
      venueTableConfigId: FIXTURE_TABLE_CONFIG_ID,
      customerName: "Ada Lovelace",
      customerEmail: "ada@example.com",
    });
    expect(result).toEqual({
      ok: true,
      message: "Cash reservation confirmed.",
      layoutItemId: FIXTURE_LAYOUT_ITEM_ID,
      customerName: "Ada Lovelace",
    });
  });

  it("returns ok:false with API message on error", async () => {
    server.use(
      http.post("*/api/v1/venue-reservations/admin/cash", () =>
        HttpResponse.json({ message: "Seat taken" }, { status: 409 }),
      ),
    );
    const result = await createAdminVenueCashReservation("token-1", {
      kind: "catalog_table",
      layoutItemId: FIXTURE_LAYOUT_ITEM_ID,
      customerName: "Ada",
      customerEmail: "ada@example.com",
    });
    expect(result).toEqual({ ok: false, message: "Seat taken" });
  });

  it("returns ok:false when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const result = await createAdminVenueCashReservation("token-1", {
      kind: "standalone_chair",
      layoutItemId: FIXTURE_LAYOUT_ITEM_ID,
      customerName: "Ada",
      customerEmail: "ada@example.com",
    });
    expect(result).toEqual({ ok: false, message: "Could not reach the server." });
  });
});
