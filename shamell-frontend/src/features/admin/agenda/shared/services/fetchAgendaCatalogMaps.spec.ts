import { describe, expect, it } from "vitest";
import {
  fetchAgendaCatalogMaps,
  parseContactLinesInquiryMap,
  parseEventTypesContactCodeMap,
  parseServicesInquiryMap,
} from "./fetchAgendaCatalogMaps";
import {
  FIXTURE_SHARED_CONTACT_LINE_ID,
  FIXTURE_SHARED_EVENT_TYPE_ID,
  FIXTURE_SHARED_SERVICE_ID,
} from "../test/fixtures/uuids.fixture";

describe("fetchAgendaCatalogMaps", () => {
  it("loads services and event types by default", async () => {
    const raw = await fetchAgendaCatalogMaps({ token: "token-1" });
    expect(Array.isArray(raw.services)).toBe(true);
    expect(Array.isArray(raw.eventTypes)).toBe(true);
    expect(raw.occasions).toBeUndefined();
    expect(raw.contactLines).toBeUndefined();
  });

  it("includes occasions and contact lines when requested", async () => {
    const raw = await fetchAgendaCatalogMaps({
      token: "token-1",
      includeOccasions: true,
      includeContactLines: true,
    });
    expect(Array.isArray(raw.occasions)).toBe(true);
    expect(Array.isArray(raw.contactLines)).toBe(true);
  });
});

describe("parseServicesInquiryMap", () => {
  it("maps inquiry codes and picks the first active fallback", () => {
    const result = parseServicesInquiryMap([
      { id: FIXTURE_SHARED_SERVICE_ID, contactInquiryCode: "SHOW", isActive: true },
      { id: "other", contactInquiryCode: "SHOW", isActive: true },
      { id: "inactive", contactInquiryCode: "X", isActive: false },
    ]);
    expect(result.serviceByInquiryCode.get("SHOW")).toBe(FIXTURE_SHARED_SERVICE_ID);
    expect(result.serviceByInquiryCode.get("X")).toBe("inactive");
    expect(result.fallbackServiceId).toBe(FIXTURE_SHARED_SERVICE_ID);
  });

  it("returns an empty map for non-arrays", () => {
    expect(parseServicesInquiryMap({}).serviceByInquiryCode.size).toBe(0);
  });
});

describe("parseEventTypesContactCodeMap", () => {
  it("maps event type ids to codes", () => {
    const map = parseEventTypesContactCodeMap([
      { id: FIXTURE_SHARED_EVENT_TYPE_ID, contactInquiryCode: "PRIVATE" },
      { id: "  ", contactInquiryCode: "SKIP" },
    ]);
    expect(map.get(FIXTURE_SHARED_EVENT_TYPE_ID)).toBe("PRIVATE");
    expect(map.size).toBe(1);
  });

  it("returns an empty map for non-arrays", () => {
    expect(parseEventTypesContactCodeMap(null).size).toBe(0);
  });
});

describe("parseContactLinesInquiryMap", () => {
  it("maps contact line ids to codes", () => {
    const map = parseContactLinesInquiryMap([
      { id: FIXTURE_SHARED_CONTACT_LINE_ID, contactInquiryCode: "GUIDANCE" },
    ]);
    expect(map.get(FIXTURE_SHARED_CONTACT_LINE_ID)).toBe("GUIDANCE");
  });

  it("returns an empty map for non-arrays", () => {
    expect(parseContactLinesInquiryMap("x").size).toBe(0);
  });
});
