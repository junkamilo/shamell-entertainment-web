/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  makeRecurringReservationEventTemplate,
  makeReservationEventTemplate,
} from "../../test/fixtures/onComingEvents.fixture";
import { FIXTURE_TEMPLATE_ID, FIXTURE_TEMPLATE_ID_2 } from "../../test/fixtures/uuids.fixture";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

import { useReservationEventTemplateOptions } from "./useReservationEventTemplateOptions";

describe("useReservationEventTemplateOptions", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads templates via MSW", async () => {
    const { result } = renderHook(() => useReservationEventTemplateOptions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.templates[0]?.id).toBe(FIXTURE_TEMPLATE_ID);
    expect(result.current.templates.length).toBe(2);
  });

  it("filters FIXED_EVENT for VENUE_SEATING experience", async () => {
    server.use(
      http.get("*/api/v1/reservation-event-templates/admin", ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("scheduleMode")).toBe("FIXED_EVENT");
        return HttpResponse.json([makeReservationEventTemplate()]);
      }),
    );
    const { result } = renderHook(() =>
      useReservationEventTemplateOptions(true, "VENUE_SEATING"),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.modeFilter).toBe("FIXED_EVENT");
    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0]?.id).toBe(FIXTURE_TEMPLATE_ID);
  });

  it("filters RECURRING_WEEKLY for CLASSES experience", async () => {
    server.use(
      http.get("*/api/v1/reservation-event-templates/admin", ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("scheduleMode")).toBe("RECURRING_WEEKLY");
        return HttpResponse.json([makeRecurringReservationEventTemplate()]);
      }),
    );
    const { result } = renderHook(() =>
      useReservationEventTemplateOptions(true, "CLASSES"),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.modeFilter).toBe("RECURRING_WEEKLY");
    expect(result.current.templates[0]?.id).toBe(FIXTURE_TEMPLATE_ID_2);
  });

  it("clears templates when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useReservationEventTemplateOptions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.templates).toEqual([]);
  });

  it("toasts on load failure", async () => {
    server.use(
      http.get("*/api/v1/reservation-event-templates/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useReservationEventTemplateOptions());
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Could not load templates",
        }),
      ),
    );
    expect(result.current.templates).toEqual([]);
  });

  it("does not load when disabled", async () => {
    const { result } = renderHook(() => useReservationEventTemplateOptions(false));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.templates).toEqual([]);
  });
});
