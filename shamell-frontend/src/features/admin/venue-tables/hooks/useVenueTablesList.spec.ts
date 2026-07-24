/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { FIXTURE_TABLE_ID } from "../test/fixtures/uuids.fixture";

const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

import { useVenueTablesList } from "./useVenueTablesList";

describe("useVenueTablesList", () => {
  beforeEach(() => {
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads items via MSW", async () => {
    const { result } = renderHook(() => useVenueTablesList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.items[0]?.id).toBe(FIXTURE_TABLE_ID);
    expect(result.current.error).toBeNull();
  });

  it("sets error when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useVenueTablesList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Not signed in.");
    expect(result.current.items).toEqual([]);
  });

  it("sets error on API failure", async () => {
    server.use(
      http.get("*/api/v1/venue-tables/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useVenueTablesList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatch(/Could not load tables/);
  });
});
