import { describe, expect, it } from "vitest";
import {
  inferInquiryCodeFromService,
  isBespoke,
  isGalaOrVip,
  mergedInquiryCodeFromSelections,
  readableInquiryCode,
} from "./inquiryCodeUtils";
import { makePublicServiceOption } from "../../test/fixtures/contacto.fixture";
import { FIXTURE_SERVICE_ID } from "../../test/fixtures/uuids.fixture";

describe("inquiryCodeUtils", () => {
  describe("readableInquiryCode", () => {
    it("replaces underscores with spaces", () => {
      expect(readableInquiryCode("PRIVATE_GALA")).toBe("PRIVATE GALA");
    });
  });

  describe("inferInquiryCodeFromService", () => {
    it("prefers valid contactInquiryCode", () => {
      expect(inferInquiryCodeFromService("VIP_EVENT", "Any title")).toBe("VIP_EVENT");
    });

    it("infers from title keywords", () => {
      expect(inferInquiryCodeFromService(null, "VIP experience")).toBe("VIP_EVENT");
      expect(inferInquiryCodeFromService(null, "Private gala night")).toBe("PRIVATE_GALA");
      expect(inferInquiryCodeFromService(null, "Bespoke choreography")).toBe("BESPOKE");
      expect(inferInquiryCodeFromService(null, "Performance")).toBe("GENERAL");
    });
  });

  describe("mergedInquiryCodeFromSelections", () => {
    const options = [
      makePublicServiceOption({ id: "a", inquiryCode: "GENERAL" }),
      makePublicServiceOption({ id: "b", inquiryCode: "PRIVATE_GALA", title: "Gala" }),
      makePublicServiceOption({ id: "c", inquiryCode: "VIP_EVENT", title: "VIP" }),
      makePublicServiceOption({ id: "d", inquiryCode: "BESPOKE", title: "Bespoke" }),
    ];

    it("returns strictest code when multiple selected", () => {
      expect(mergedInquiryCodeFromSelections(["a", "b"], options)).toBe("PRIVATE_GALA");
      expect(mergedInquiryCodeFromSelections(["a", "c"], options)).toBe("VIP_EVENT");
      expect(mergedInquiryCodeFromSelections(["d"], options)).toBe("BESPOKE");
    });

    it("accepts raw inquiry codes in ids", () => {
      expect(mergedInquiryCodeFromSelections(["VIP_EVENT"], options)).toBe("VIP_EVENT");
    });

    it("returns empty when nothing matches", () => {
      expect(mergedInquiryCodeFromSelections([FIXTURE_SERVICE_ID], options)).toBe("");
    });
  });

  describe("isGalaOrVip / isBespoke", () => {
    it("detects gala and vip", () => {
      expect(isGalaOrVip("PRIVATE_GALA")).toBe(true);
      expect(isGalaOrVip("VIP_EVENT")).toBe(true);
      expect(isGalaOrVip("GENERAL")).toBe(false);
    });

    it("detects bespoke", () => {
      expect(isBespoke("BESPOKE")).toBe(true);
      expect(isBespoke("GENERAL")).toBe(false);
    });
  });
});
