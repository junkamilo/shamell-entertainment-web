/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { venueAvailabilityHandler } from "../../test/mocks/handlers";
import { FIXTURE_LAYOUT_ID } from "../../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");
const routerPushMock = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPushMock }),
}));

vi.mock("@/lib/onComingEventsReservationsNotice", () => ({
  readLastSeenPaidReservationAtMs: () => 0,
  writeLastSeenPaidReservationAtMs: vi.fn(),
  notifyOnComingEventsBadgeRefresh: vi.fn(),
}));

import { useFloorLayoutEditor } from "./useFloorLayoutEditor";

describe("useFloorLayoutEditor", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
    routerPushMock.mockClear();

    server.use(
      venueAvailabilityHandler(),
      http.get("*/api/v1/venue-tables/admin", () =>
        HttpResponse.json([
          {
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            tableName: "Large 1",
            size: "LARGE",
            includedChairs: 8,
            bundlePrice: 250,
            sortOrder: 0,
          },
        ]),
      ),
      http.get("*/api/v1/standalone-chairs/admin", () =>
        HttpResponse.json({
          config: {
            chairs: [
              {
                id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                chairName: "Chair 1",
                displayLabel: "Chair 1",
                unitPrice: 35,
                sortOrder: 0,
              },
            ],
          },
        }),
      ),
      http.get("*/api/v1/venue-reservations/admin", () =>
        HttpResponse.json({
          reservations: [],
          meta: { page: 1, perPage: 50, totalItems: 0, totalPages: 1, hasPrev: false, hasNext: false },
        }),
      ),
    );
  });

  it("starts loading then loads layout via MSW", async () => {
    const { result } = renderHook(() => useFloorLayoutEditor());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.layoutMeta.id).toBe(FIXTURE_LAYOUT_ID);
    expect(result.current.items.length).toBeGreaterThan(0);
    expect(result.current.palette.tablesBySize.LARGE).toBeGreaterThanOrEqual(0);
  });

  it("sets error when not signed in", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useFloorLayoutEditor());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Not signed in.");
  });
});
