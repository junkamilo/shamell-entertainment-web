import type {
  EventTypeItem,
  OccasionCatalogItem,
} from "../../types/eventTypes.types";
import {
  FIXTURE_EVENT_TYPE_ID,
  FIXTURE_EVENT_TYPE_ID_2,
  FIXTURE_OCCASION_ID,
  FIXTURE_OCCASION_ID_2,
} from "./uuids.fixture";

export function makeOccasionCatalogItem(
  overrides: Partial<OccasionCatalogItem> = {},
): OccasionCatalogItem {
  return {
    id: FIXTURE_OCCASION_ID,
    name: "Birthday",
    isActive: true,
    ...overrides,
  };
}

export function makeEventTypeItem(
  overrides: Partial<EventTypeItem> = {},
): EventTypeItem {
  return {
    id: FIXTURE_EVENT_TYPE_ID,
    name: "Private weddings",
    isActive: true,
    catalogChannel: "BOOKING",
    contactInquiryCode: "PRIVATE",
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
    eventCount: 0,
    bookingCount: 0,
    galleryPhotoCount: 0,
    occasionAssignments: [
      {
        occasionTypeId: FIXTURE_OCCASION_ID,
        usage: "OCCASION_SINGLE",
        sortOrder: 0,
        occasionName: "Birthday",
      },
    ],
    ...overrides,
  };
}

export function makeEventTypesApiPayload(
  items: EventTypeItem[] = [
    makeEventTypeItem(),
    makeEventTypeItem({
      id: FIXTURE_EVENT_TYPE_ID_2,
      name: "Corporate gala",
      isActive: false,
      contactInquiryCode: "VIP_EVENT",
      occasionAssignments: [],
    }),
  ],
) {
  return items;
}

export function makeOccasionsApiPayload(
  items: OccasionCatalogItem[] = [
    makeOccasionCatalogItem(),
    makeOccasionCatalogItem({
      id: FIXTURE_OCCASION_ID_2,
      name: "Anniversary",
      isActive: true,
    }),
  ],
) {
  return items;
}
