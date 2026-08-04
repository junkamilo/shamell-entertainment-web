import { vi } from "vitest";
import {
  makeInquiryDeepLinkCases,
  makePublicAvailabilityRules,
} from "../fixtures/contactoLib.fixture";
import { FIXTURE_BOOKING_TZ, FIXTURE_INQUIRY_CODE } from "../fixtures/uuids.fixture";

export function createMockContactoAvailabilityState(
  overrides: Record<string, unknown> = {},
) {
  return {
    rules: makePublicAvailabilityRules(),
    timeZone: FIXTURE_BOOKING_TZ,
    isLoading: false,
    ...overrides,
  };
}

export function createMockInquiryConstantsState(
  overrides: Record<string, unknown> = {},
) {
  const links = makeInquiryDeepLinkCases();
  return {
    code: FIXTURE_INQUIRY_CODE,
    serviceHref: links.serviceHref,
    resolve: vi.fn(),
    ...overrides,
  };
}
