import type {
  AdminEvent,
  EventsEventTypeOption,
} from "../../types/events.types";
import {
  FIXTURE_CATALOG_IMAGE_ID,
  FIXTURE_EVENT_ID,
  FIXTURE_EVENT_ID_2,
  FIXTURE_EVENT_TYPE_ID,
} from "./uuids.fixture";

export function makeEventTypeOption(
  overrides: Partial<EventsEventTypeOption> = {},
): EventsEventTypeOption {
  return {
    id: FIXTURE_EVENT_TYPE_ID,
    name: "Private weddings",
    isActive: true,
    ...overrides,
  };
}

export function makeAdminEvent(overrides: Partial<AdminEvent> = {}): AdminEvent {
  return {
    id: FIXTURE_EVENT_ID,
    eventTypeId: FIXTURE_EVENT_TYPE_ID,
    eventTypeName: "Private weddings",
    description: "An elegant private wedding package with full staging.",
    items: ["Dance set", "Sound check"],
    price: 2500,
    catalogImages: [
      {
        id: FIXTURE_CATALOG_IMAGE_ID,
        imageUrl: "https://cdn.example.com/event.jpg",
        mediaType: "image",
      },
    ],
    isActive: true,
    showOnHome: true,
    publicSection: "GENERAL",
    slug: "private-wedding",
    experienceType: null,
    classVariant: null,
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
    bookingCount: 0,
    galleryPhotoCount: 0,
    ...overrides,
  };
}

export function makeAdminEventsApiPayload(
  items: AdminEvent[] = [
    makeAdminEvent(),
    makeAdminEvent({
      id: FIXTURE_EVENT_ID_2,
      description: "Corporate gala night with VIP tables.",
      items: ["Host"],
      price: 1800,
      isActive: false,
      showOnHome: false,
      catalogImages: [],
    }),
  ],
) {
  return items;
}
