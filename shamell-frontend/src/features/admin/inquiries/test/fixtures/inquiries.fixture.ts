import {
  FIXTURE_EVENT_ID,
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_OCCASION_TYPE_ID,
  FIXTURE_SERVICE_ID,
} from "./uuids.fixture";

/** Rich inquiryDetails payload covering most mapper branches. */
export function makeInquiryDetails(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    entrySource: "contact_page",
    planningStage: "DATE_OR_VENUE_READY",
    occasionHint: "Rooftop evening",
    visionSummary: "Elegant belly dance set with live music.",
    eventTypeLabel: "Private weddings",
    occasionSingleLabel: "Anniversary",
    experienceAddons: ["FIRE", "SWORD_CANDELABRA"],
    serviceLabels: ["Solo performance", "Host"],
    guideInvestmentTotalUsd: 2500,
    guideInvestmentIsPartial: false,
    eventTimeStart: "19:00",
    eventTimeEnd: "22:00",
    guestCount: 80,
    eventAddress: "123 Ocean Ave",
    venueIndoor: true,
    ...overrides,
  };
}

export function makeConciergeInquiryDetails(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return makeInquiryDetails({
    entrySource: "concierge_gate",
    conciergeIntent: "needs_guidance",
    planningStage: "EARLY_IDEA",
    ...overrides,
  });
}

export function makeTechnicalInquiryDetails(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return makeInquiryDetails({
    eventId: FIXTURE_EVENT_ID,
    eventTypeId: FIXTURE_EVENT_TYPE_ID,
    occasionTypeId: FIXTURE_OCCASION_TYPE_ID,
    serviceIds: [FIXTURE_SERVICE_ID],
    occasionTypeIdsProject: [FIXTURE_OCCASION_TYPE_ID],
    occasionTypeIdsRole: [FIXTURE_OCCASION_TYPE_ID],
    ...overrides,
  });
}

export function makeInquiryDetailRows(
  rows: { label: string; value: string }[] = [
    { label: "Event type", value: "Private weddings" },
    { label: "Guests (approx.)", value: "80" },
  ],
) {
  return rows;
}
