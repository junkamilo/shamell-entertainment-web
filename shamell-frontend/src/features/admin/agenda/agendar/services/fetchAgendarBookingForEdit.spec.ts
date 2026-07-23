import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchAgendarBookingForEdit } from "./fetchAgendarBookingForEdit";
import { makeAdminBookingRow } from "../tests/fixtures/bookingRow.fixture";
import { FIXTURE_BOOKING_ID } from "../tests/fixtures/uuids.fixture";

vi.mock("@/app/admin/shared/lib/adminApiBaseUrl", () => ({
  getAdminApiBaseUrl: () => "http://test-api",
}));

describe("fetchAgendarBookingForEdit", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns booking row on success", async () => {
    const row = makeAdminBookingRow();
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => row,
    } as Response);

    const result = await fetchAgendarBookingForEdit("token-123", FIXTURE_BOOKING_ID);
    expect(result).toEqual(row);
    expect(fetch).toHaveBeenCalledWith(
      `http://test-api/api/v1/bookings/admin/${FIXTURE_BOOKING_ID}`,
      {
        headers: { Authorization: "Bearer token-123" },
        cache: "no-store",
      },
    );
  });

  it("URL-encodes the booking id", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => makeAdminBookingRow(),
    } as Response);

    await fetchAgendarBookingForEdit("token-123", "id/with spaces");
    expect(fetch).toHaveBeenCalledWith(
      "http://test-api/api/v1/bookings/admin/id%2Fwith%20spaces",
      expect.any(Object),
    );
  });

  it("throws with API message on 404", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ message: "Booking not found" }),
    } as Response);

    await expect(fetchAgendarBookingForEdit("token-123", FIXTURE_BOOKING_ID)).rejects.toThrow(
      "Booking not found",
    );
  });

  it("throws default message on 401", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);

    await expect(fetchAgendarBookingForEdit("token-123", FIXTURE_BOOKING_ID)).rejects.toThrow(
      "Could not load booking.",
    );
  });

  it("throws default message when error body is not JSON", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("invalid json");
      },
    } as unknown as Response);

    await expect(fetchAgendarBookingForEdit("token-123", FIXTURE_BOOKING_ID)).rejects.toThrow(
      "Could not load booking.",
    );
  });
});
