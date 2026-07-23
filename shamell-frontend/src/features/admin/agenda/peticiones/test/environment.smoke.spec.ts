import { describe, expect, it } from "vitest";
import { fetchAdminPeticiones } from "../services/fetchAdminPeticiones";
import { fetchContactLinesInquiryMap } from "../services/fetchContactLinesInquiryMap";
import { fetchEventTypesContactCodeMap } from "../services/fetchEventTypesContactCodeMap";
import { fetchServicesInquiryMap } from "../services/fetchServicesInquiryMap";
import {
  makeContactRequest,
  makePeticionesList,
} from "./fixtures/peticiones.fixture";
import { FIXTURE_CONTACT_ID, FIXTURE_SERVICE_ID } from "./fixtures/uuids.fixture";
import { createMockPeticionesPageState } from "./helpers/mockPeticionesPage";

describe("peticiones test environment", () => {
  it("exposes usable fixtures and page mock", () => {
    expect(makeContactRequest().id).toBe(FIXTURE_CONTACT_ID);
    expect(makePeticionesList().items).toHaveLength(2);

    const page = createMockPeticionesPageState({ activeLane: "guidance" });
    expect(page.activeLane).toBe("guidance");
    page.setPage(2);
    expect(page.setPage).toHaveBeenCalledWith(2);
  });

  it("serves peticiones inbox and catalog maps via MSW", async () => {
    const list = await fetchAdminPeticiones("token-1", {
      page: 1,
      perPage: 10,
      lane: "bookings",
    });
    expect(list.items[0]?.id).toBe(FIXTURE_CONTACT_ID);

    const services = await fetchServicesInquiryMap("token-1");
    expect(services.serviceByInquiryCode.get("SHOW")).toBe(FIXTURE_SERVICE_ID);

    const eventTypes = await fetchEventTypesContactCodeMap("token-1");
    expect(eventTypes.size).toBeGreaterThan(0);

    const lines = await fetchContactLinesInquiryMap("token-1");
    expect(lines.size).toBeGreaterThan(0);
  });
});
