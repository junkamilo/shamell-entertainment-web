import { describe, expect, it } from "vitest";
import {
  ADMIN_INQUIRY_CODE_OPTIONS,
  appendCatalogToContactHref,
  buildEventLineContactHref,
  buildServiceInquireHref,
  CONTACTO_PATH,
  EXPERIENCE_ADDON_OPTIONS,
  isContactCatalogUuid,
  isValidInquiryCode,
  isValidServiceTypeParam,
  parseContactCatalogParams,
  parseInquiryEntrySource,
  resolveServiceLineFromCatalog,
  SERVICE_TYPE_CODES,
} from "./contactInquiryConstants";
import {
  FIXTURE_CATALOG_UUID,
  FIXTURE_INQUIRY_CODE,
} from "./test/fixtures/uuids.fixture";

describe("contactInquiryConstants", () => {
  it("validates inquiry codes and entry sources", () => {
    expect(isValidInquiryCode(FIXTURE_INQUIRY_CODE)).toBe(true);
    expect(isValidServiceTypeParam("VIP_EVENT")).toBe(true);
    expect(isValidInquiryCode("NOPE")).toBe(false);
    expect(isValidInquiryCode(null)).toBe(false);
    expect(SERVICE_TYPE_CODES).toContain("GENERAL");

    expect(parseInquiryEntrySource("home_service_card")).toBe(
      "home_service_card",
    );
    expect(parseInquiryEntrySource("unknown")).toBeUndefined();
    expect(parseInquiryEntrySource(null)).toBeUndefined();
  });

  it("resolves service lines and builds inquire hrefs", () => {
    expect(resolveServiceLineFromCatalog("BESPOKE")).toBe("BESPOKE");
    expect(resolveServiceLineFromCatalog(null)).toBe("GENERAL");
    expect(buildServiceInquireHref("VIP_EVENT")).toBe(
      `${CONTACTO_PATH}?serviceType=VIP_EVENT&entry=home_service_card`,
    );
  });

  it("parses and appends catalog deep-link params", () => {
    expect(isContactCatalogUuid(FIXTURE_CATALOG_UUID)).toBe(true);
    expect(isContactCatalogUuid("not-a-uuid")).toBe(false);

    expect(
      parseContactCatalogParams("service", FIXTURE_CATALOG_UUID),
    ).toEqual({ kind: "service", id: FIXTURE_CATALOG_UUID });
    expect(parseContactCatalogParams("table", FIXTURE_CATALOG_UUID)).toBeUndefined();
    expect(parseContactCatalogParams("event", "bad")).toBeUndefined();

    expect(
      appendCatalogToContactHref(CONTACTO_PATH, "event", FIXTURE_CATALOG_UUID),
    ).toContain(`catalogKind=event&catalogId=${encodeURIComponent(FIXTURE_CATALOG_UUID)}`);
    expect(appendCatalogToContactHref(`${CONTACTO_PATH}?x=1`, "service", "bad")).toBe(
      `${CONTACTO_PATH}?x=1`,
    );

    expect(buildEventLineContactHref(FIXTURE_CATALOG_UUID)).toContain(
      `eventId=${encodeURIComponent(FIXTURE_CATALOG_UUID)}`,
    );
    expect(buildEventLineContactHref("bad")).toBe(
      `${CONTACTO_PATH}?entry=home_service_card`,
    );
  });

  it("exposes addon and admin select option catalogs", () => {
    expect(EXPERIENCE_ADDON_OPTIONS.map((o) => o.value)).toEqual([
      "FIRE",
      "VEIL_FAN_LED",
      "SWORD_CANDELABRA",
    ]);
    expect(ADMIN_INQUIRY_CODE_OPTIONS.some((o) => o.value === "")).toBe(true);
    expect(
      ADMIN_INQUIRY_CODE_OPTIONS.some((o) => o.value === FIXTURE_INQUIRY_CODE),
    ).toBe(true);
  });
});
