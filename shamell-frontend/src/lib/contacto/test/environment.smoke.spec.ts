/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  makeInquiryDeepLinkCases,
  makePublicAvailabilityRules,
} from "./fixtures/contactoLib.fixture";
import {
  FIXTURE_BOOKING_TZ,
  FIXTURE_CATALOG_UUID,
  FIXTURE_INQUIRY_CODE,
} from "./fixtures/uuids.fixture";
import { createMockContactoAvailabilityState } from "./helpers/mockContactoLib";
import { buildServiceInquireHref } from "../contactInquiryConstants";
import { hhmmToMinutes } from "../contactLogisticsUtils";
import { addDaysISO } from "../bookingAvailability";

describe("contacto lib test environment", () => {
  it("exposes usable fixtures and mocks", () => {
    expect(makePublicAvailabilityRules().timeZone).toBe(FIXTURE_BOOKING_TZ);
    expect(makeInquiryDeepLinkCases().code).toBe(FIXTURE_INQUIRY_CODE);
    expect(createMockContactoAvailabilityState().rules.weekly).toHaveLength(7);
    expect(FIXTURE_CATALOG_UUID).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it("keeps core helpers wired for smoke", () => {
    expect(buildServiceInquireHref(FIXTURE_INQUIRY_CODE)).toContain(
      `serviceType=${FIXTURE_INQUIRY_CODE}`,
    );
    expect(hhmmToMinutes("14:30")).toBe(14 * 60 + 30);
    expect(addDaysISO("2030-01-01", 1)).toBe("2030-01-02");
  });
});
