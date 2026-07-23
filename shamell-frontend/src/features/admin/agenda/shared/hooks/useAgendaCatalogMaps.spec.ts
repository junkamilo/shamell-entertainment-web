/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

const getTokenMock = vi.fn((): string | null => "token-1");
const fetchMapsMock = vi.fn(async () => ({
  services: [{ id: "svc-1" }],
  eventTypes: [{ id: "et-1" }],
  contactLines: [{ id: "line-1" }],
}));
const parseServicesMock = vi.fn(() => ({
  serviceByInquiryCode: new Map([["PRIVATE_CLASS", "svc-1"]]),
  fallbackServiceId: "svc-1",
}));
const parseEventTypesMock = vi.fn(() => new Map([["et-1", "SHOW"]]));
const parseContactLinesMock = vi.fn(() => new Map([["line-1", "PRIVATE_CLASS"]]));

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

vi.mock("../services/fetchAgendaCatalogMaps", () => ({
  fetchAgendaCatalogMaps: (...args: unknown[]) => fetchMapsMock(...args),
  parseServicesInquiryMap: (...args: unknown[]) => parseServicesMock(...args),
  parseEventTypesContactCodeMap: (...args: unknown[]) => parseEventTypesMock(...args),
  parseContactLinesInquiryMap: (...args: unknown[]) => parseContactLinesMock(...args),
}));

import { useAgendaCatalogMaps } from "./useAgendaCatalogMaps";

describe("useAgendaCatalogMaps", () => {
  beforeEach(() => {
    getTokenMock.mockReturnValue("token-1");
    fetchMapsMock.mockClear();
    fetchMapsMock.mockResolvedValue({
      services: [{ id: "svc-1" }],
      eventTypes: [{ id: "et-1" }],
      contactLines: [{ id: "line-1" }],
    });
    parseServicesMock.mockClear();
    parseEventTypesMock.mockClear();
    parseContactLinesMock.mockClear();
  });

  it("returns empty maps when there is no token", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useAgendaCatalogMaps());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.serviceByInquiryCode.size).toBe(0);
    expect(result.current.fallbackServiceId).toBeUndefined();
    expect(fetchMapsMock).not.toHaveBeenCalled();
  });

  it("loads and parses catalog maps", async () => {
    const { result } = renderHook(() => useAgendaCatalogMaps());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.serviceByInquiryCode.get("PRIVATE_CLASS")).toBe("svc-1");
    expect(result.current.fallbackServiceId).toBe("svc-1");
    expect(result.current.eventTypeContactCodeById.get("et-1")).toBe("SHOW");
    expect(parseContactLinesMock).not.toHaveBeenCalled();
    expect(fetchMapsMock).toHaveBeenCalledWith({
      token: "token-1",
      includeOccasions: false,
      includeContactLines: false,
    });
  });

  it("parses contact lines when includeContactLines is true", async () => {
    const { result } = renderHook(() =>
      useAgendaCatalogMaps({ includeContactLines: true }),
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.inquiryCodeByCatalogLineId.get("line-1")).toBe("PRIVATE_CLASS");
    expect(parseContactLinesMock).toHaveBeenCalled();
  });

  it("clears maps when the fetch fails", async () => {
    fetchMapsMock.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useAgendaCatalogMaps());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.serviceByInquiryCode.size).toBe(0);
    expect(result.current.fallbackServiceId).toBeUndefined();
  });
});
