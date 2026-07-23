import {
  FIXTURE_SHARED_CONTACT_LINE_ID,
  FIXTURE_SHARED_EVENT_TYPE_ID,
  FIXTURE_SHARED_OCCASION_ID,
  FIXTURE_SHARED_SERVICE_ID,
} from "./uuids.fixture";

export function makeCatalogServicesPayload() {
  return [
    {
      id: FIXTURE_SHARED_SERVICE_ID,
      contactInquiryCode: "SHOW",
      isActive: true,
    },
    {
      id: "s-inactive",
      contactInquiryCode: "INACTIVE",
      isActive: false,
    },
  ];
}

export function makeCatalogEventTypesPayload() {
  return [
    {
      id: FIXTURE_SHARED_EVENT_TYPE_ID,
      contactInquiryCode: "PRIVATE",
      isActive: true,
    },
  ];
}

export function makeCatalogOccasionsPayload() {
  return [
    {
      id: FIXTURE_SHARED_OCCASION_ID,
      name: "Birthday",
      isActive: true,
    },
  ];
}

export function makeCatalogContactLinesPayload() {
  return [
    {
      id: FIXTURE_SHARED_CONTACT_LINE_ID,
      contactInquiryCode: "GUIDANCE",
    },
  ];
}

export function makeAgendaCatalogMapsRaw(
  overrides: {
    services?: unknown;
    eventTypes?: unknown;
    occasions?: unknown;
    contactLines?: unknown;
  } = {},
) {
  return {
    services: overrides.services ?? makeCatalogServicesPayload(),
    eventTypes: overrides.eventTypes ?? makeCatalogEventTypesPayload(),
    occasions: overrides.occasions ?? makeCatalogOccasionsPayload(),
    contactLines: overrides.contactLines ?? makeCatalogContactLinesPayload(),
  };
}
