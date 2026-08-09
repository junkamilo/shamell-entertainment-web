import type {
  GuideInvestmentCompute,
  SanitizedInquiryDetails,
} from '../types/booking-inquiry.types';

const SERVICE_A = '11111111-1111-4111-8111-111111111111';
const SERVICE_B = '22222222-2222-4222-8222-222222222222';
const EVENT_ID = '33333333-3333-4333-8333-333333333333';
const EVENT_TYPE_ID = '44444444-4444-4444-8444-444444444444';

export const bookingInquiryFixtureIds = {
  SERVICE_A,
  SERVICE_B,
  EVENT_ID,
  EVENT_TYPE_ID,
} as const;

export function makeSanitizedInquiryDetails(
  overrides: Partial<SanitizedInquiryDetails> = {},
): SanitizedInquiryDetails {
  return {
    entrySource: 'contact_page',
    guestCount: 50,
    ...overrides,
  };
}

export function makeValidRawInquiryDetails(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    entrySource: 'contact_page',
    guestCount: 50,
    experienceAddons: ['FIRE'],
    ...overrides,
  };
}

export function makeGuideInvestmentCompute(
  overrides: Partial<GuideInvestmentCompute> = {},
): GuideInvestmentCompute {
  return {
    totalUsd: 500,
    isPartial: false,
    ...overrides,
  };
}

export function makeEventPriceRow(price: number | null) {
  return { price };
}

export function makeServicePriceRow(id: string, price: number | null) {
  return { id, price };
}
