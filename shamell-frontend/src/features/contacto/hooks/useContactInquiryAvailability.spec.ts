/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useState } from "react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { makeOccupiedRangesPayload } from "../test/fixtures/contacto.fixture";
import { emptyWizard } from "../lib/inquiry/wizardValidation";
import type { WizardData } from "../lib/inquiry/wizardTypes";
import { useContactInquiryAvailability } from "./useContactInquiryAvailability";

const availabilityRules = {
  timeZone: "America/New_York",
  weekly: [],
  closures: [],
};

vi.mock("@/hooks/use-public-availability", () => ({
  usePublicAvailability: () => ({
    rules: availabilityRules,
    isLoading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

function useAvailabilityHarness(initialData?: Partial<WizardData>) {
  const [data, setData] = useState({ ...emptyWizard(), ...initialData });
  const [stepError, setStepError] = useState<string | null>(null);
  const availability = useContactInquiryAvailability({ data, setData, setStepError });
  return { availability, data, setData, stepError, setStepError };
}

describe("useContactInquiryAvailability", () => {
  beforeEach(() => {
    server.use(
      http.get("*/api/v1/bookings/public/occupied", () =>
        HttpResponse.json(makeOccupiedRangesPayload([{ startMinutes: 1140, endMinutes: 1200 }])),
      ),
    );
  });

  it("loads occupied ranges when eventDate is set", async () => {
    const { result } = renderHook(() =>
      useAvailabilityHarness({ eventDate: "2030-08-01" }),
    );

    await waitFor(() => expect(result.current.availability.occupiedRanges.length).toBe(1));
    expect(result.current.availability.occupiedRanges[0]).toEqual({
      startMinutes: 1140,
      endMinutes: 1200,
    });
  });

  it("clears occupied ranges when eventDate is cleared", async () => {
    const { result } = renderHook(() =>
      useAvailabilityHarness({ eventDate: "2030-08-01" }),
    );

    await waitFor(() => expect(result.current.availability.occupiedRanges.length).toBe(1));

    act(() => {
      result.current.setData((prev) => ({ ...prev, eventDate: "" }));
    });

    await waitFor(() => expect(result.current.availability.occupiedRanges).toEqual([]));
  });

  it("exposes booking timezone and availability rules", () => {
    const { result } = renderHook(() => useAvailabilityHarness());
    expect(result.current.availability.bookingTz).toBeTruthy();
    expect(result.current.availability.availabilityRules).toEqual(availabilityRules);
  });

  it("clears conflicting times and sets step error", async () => {
    const { result } = renderHook(() =>
      useAvailabilityHarness({
        eventDate: "2030-08-01",
        eventTimeStart: "19:00",
        eventTimeEnd: "20:00",
      }),
    );

    await waitFor(() => expect(result.current.availability.occupiedRanges.length).toBe(1));

    await waitFor(() =>
      expect(result.current.stepError).toMatch(/no longer available/i),
    );
    expect(result.current.data.eventTimeStart).toBe("");
    expect(result.current.data.eventTimeEnd).toBe("");
  });

  it("handles occupied fetch failure gracefully", async () => {
    server.use(
      http.get("*/api/v1/bookings/public/occupied", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() =>
      useAvailabilityHarness({ eventDate: "2030-08-01" }),
    );

    await waitFor(() => expect(result.current.availability.occupiedRanges).toEqual([]));
  });

  it("toggles picker state", () => {
    const { result } = renderHook(() => useAvailabilityHarness());

    act(() => {
      result.current.availability.setDatePickerOpen(true);
      result.current.availability.setTimePickerWhich("start");
    });

    expect(result.current.availability.datePickerOpen).toBe(true);
    expect(result.current.availability.timePickerWhich).toBe("start");
  });
});
