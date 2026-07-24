/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
const VALID_EVENT_ID = "22222222-2222-4222-8222-222222222222";
const VALID_CATALOG_ID = "33333333-3333-4333-8333-333333333333";

const scrollTo = vi.fn();
let params = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => params.get(key),
    toString: () => params.toString(),
  }),
}));

import { useContactInquiryGate } from "./useContactInquiryGate";

describe("useContactInquiryGate", () => {
  beforeEach(() => {
    params = new URLSearchParams();
    scrollTo.mockClear();
    vi.stubGlobal("scrollTo", scrollTo);
    Object.defineProperty(window.history, "scrollRestoration", {
      configurable: true,
      value: "auto",
      writable: true,
    });
  });

  it("shows concierge gate by default", () => {
    const { result } = renderHook(() => useContactInquiryGate());
    expect(result.current).toEqual({ view: "concierge_gate" });
  });

  it("shows concierge form when mode=concierge without inquiry context", () => {
    params.set("mode", "concierge");
    const { result } = renderHook(() => useContactInquiryGate());
    expect(result.current).toEqual({ view: "concierge_form" });
  });

  it("shows booking form when mode=booking", () => {
    params.set("mode", "booking");
    const { result } = renderHook(() => useContactInquiryGate());
    expect(result.current.view).toBe("booking_form");
    if (result.current.view === "booking_form") {
      expect(result.current.formProps.entrySource).toBe("contact_page");
    }
  });

  it("shows booking form with serviceType deep link", () => {
    params.set("serviceType", "VIP_EVENT");
    const { result } = renderHook(() => useContactInquiryGate());
    expect(result.current.view).toBe("booking_form");
    if (result.current.view === "booking_form") {
      expect(result.current.formProps.initialServiceType).toBe("VIP_EVENT");
      expect(result.current.formProps.hadServiceTypeInUrl).toBe(true);
      expect(result.current.formProps.entrySource).toBe("home_service_card");
    }
  });

  it("shows booking form with eventId and catalog params", () => {
    params.set("eventId", VALID_EVENT_ID);
    params.set("catalogKind", "event");
    params.set("catalogId", VALID_CATALOG_ID);
    params.set("entry", "inquire_section");

    const { result } = renderHook(() => useContactInquiryGate());
    expect(result.current.view).toBe("booking_form");
    if (result.current.view === "booking_form") {
      expect(result.current.formProps.initialEventId).toBe(VALID_EVENT_ID);
      expect(result.current.formProps.hadEventIdInUrl).toBe(true);
      expect(result.current.formProps.initialCatalog).toEqual({
        kind: "event",
        id: VALID_CATALOG_ID,
      });
      expect(result.current.formProps.entrySource).toBe("inquire_section");
    }
  });
});
