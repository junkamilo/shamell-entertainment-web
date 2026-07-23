import { describe, expect, it } from "vitest";
import {
  fetchAgendaCatalogMaps,
  parseContactLinesInquiryMap,
  parseEventTypesContactCodeMap,
  parseServicesInquiryMap,
} from "../services/fetchAgendaCatalogMaps";
import {
  makeAgendaCatalogMapsRaw,
  makeCatalogServicesPayload,
} from "./fixtures/agendaShared.fixture";
import {
  FIXTURE_SHARED_CONTACT_LINE_ID,
  FIXTURE_SHARED_EVENT_TYPE_ID,
  FIXTURE_SHARED_SERVICE_ID,
} from "./fixtures/uuids.fixture";
import { createMockAgendaCatalogMapsState } from "./helpers/mockAgendaShared";

describe("agenda shared test environment", () => {
  it("exposes usable fixtures and catalog mock", () => {
    expect(makeCatalogServicesPayload()[0]?.id).toBe(FIXTURE_SHARED_SERVICE_ID);
    expect(makeAgendaCatalogMapsRaw().occasions).toBeDefined();

    const state = createMockAgendaCatalogMapsState({ loading: true });
    expect(state.loading).toBe(true);
    expect(state.serviceByInquiryCode.get("SHOW")).toBe("svc-1");
  });

  it("serves catalog maps via MSW and parses inquiry codes", async () => {
    const raw = await fetchAgendaCatalogMaps({
      token: "token-1",
      includeOccasions: true,
      includeContactLines: true,
    });
    expect(Array.isArray(raw.services)).toBe(true);
    expect(Array.isArray(raw.eventTypes)).toBe(true);
    expect(Array.isArray(raw.occasions)).toBe(true);
    expect(Array.isArray(raw.contactLines)).toBe(true);

    const services = parseServicesInquiryMap(raw.services);
    expect(services.serviceByInquiryCode.get("SHOW")).toBe(FIXTURE_SHARED_SERVICE_ID);

    const eventTypes = parseEventTypesContactCodeMap(raw.eventTypes);
    expect(eventTypes.get(FIXTURE_SHARED_EVENT_TYPE_ID)).toBe("PRIVATE");

    const lines = parseContactLinesInquiryMap(raw.contactLines);
    expect(lines.get(FIXTURE_SHARED_CONTACT_LINE_ID)).toBe("GUIDANCE");
  });
});
