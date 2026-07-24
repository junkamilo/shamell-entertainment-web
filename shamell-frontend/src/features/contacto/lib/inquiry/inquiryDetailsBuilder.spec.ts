import { describe, expect, it } from "vitest";
import { buildInquiryDetails, lineDescriptionPreview } from "./inquiryDetailsBuilder";
import { makeCatalogSnapshot, makePublicServiceOption, makeWizardData } from "../../test/fixtures/contacto.fixture";
import {
  FIXTURE_CATALOG_ID,
  FIXTURE_CONTACT_LINE_ID,
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_OCCASION_ID,
  FIXTURE_SERVICE_ID,
} from "../../test/fixtures/uuids.fixture";

describe("inquiryDetailsBuilder", () => {
  describe("buildInquiryDetails", () => {
    it("includes entry source and event fields", () => {
      const details = buildInquiryDetails(
        makeWizardData({
          inquiryCode: "GENERAL",
          occasionTypeId: FIXTURE_OCCASION_ID,
          guestCount: "120",
          venueIndoor: "outdoor",
        }),
        "home_service_card",
        null,
        [],
      );

      expect(details).toMatchObject({
        entrySource: "home_service_card",
        eventId: FIXTURE_CONTACT_LINE_ID,
        eventTypeId: FIXTURE_EVENT_TYPE_ID,
        occasionTypeId: FIXTURE_OCCASION_ID,
        guestCount: 120,
        venueIndoor: false,
        eventTimeStart: "19:00",
        eventTimeEnd: "22:00",
      });
    });

    it("includes active catalog snapshot metadata", () => {
      const catalog = makeCatalogSnapshot({
        kind: "service",
        id: FIXTURE_CATALOG_ID,
        title: "Performance package",
      });

      const details = buildInquiryDetails(
        makeWizardData({ inquiryCode: "GENERAL" }),
        "contact_page",
        catalog,
        [],
      );

      expect(details).toMatchObject({
        sourceCatalogKind: "service",
        sourceCatalogId: FIXTURE_CATALOG_ID,
        sourceCatalogTitle: "Performance package",
      });
    });

    it("maps service UUIDs and labels", () => {
      const serviceId = "11111111-1111-4111-8111-111111111111";
      const options = [
        makePublicServiceOption({ id: serviceId, title: "Performance" }),
      ];

      const details = buildInquiryDetails(
        makeWizardData({
          inquiryCode: "GENERAL",
          serviceOptionIds: [serviceId],
        }),
        "contact_page",
        null,
        options,
      );

      expect(details?.serviceIds).toEqual([serviceId]);
      expect(details?.serviceLabels).toEqual(["Performance"]);
    });

    it("includes experience addons for gala/vip only", () => {
      const gala = buildInquiryDetails(
        makeWizardData({
          inquiryCode: "PRIVATE_GALA",
          experienceAddons: ["FIRE"],
        }),
        "contact_page",
        null,
        [],
      );
      expect(gala?.experienceAddons).toEqual(["FIRE"]);

      const general = buildInquiryDetails(
        makeWizardData({
          inquiryCode: "GENERAL",
          experienceAddons: ["FIRE"],
        }),
        "contact_page",
        null,
        [],
      );
      expect(general?.experienceAddons).toBeUndefined();
    });

    it("omits eventId for event_type lines", () => {
      const details = buildInquiryDetails(
        makeWizardData({
          contactLineKind: "event_type",
          contactLineId: FIXTURE_CONTACT_LINE_ID,
        }),
        "contact_page",
        null,
        [],
      );

      expect(details?.eventId).toBeUndefined();
      expect(details?.eventTypeId).toBe(FIXTURE_EVENT_TYPE_ID);
    });
  });

  describe("lineDescriptionPreview", () => {
    it("collapses whitespace and truncates long text", () => {
      const long = "A".repeat(150);
      expect(lineDescriptionPreview(`  hello   world  `)).toBe("hello world");
      expect(lineDescriptionPreview(long).length).toBeLessThanOrEqual(140);
      expect(lineDescriptionPreview(long).endsWith("…")).toBe(true);
    });

    it("returns empty string for blank input", () => {
      expect(lineDescriptionPreview("   ")).toBe("");
    });
  });
});
