import {
  EventPublicSection,
  EventTypeCatalogChannel,
  EventTypeOccasionUsage,
  GalleryMediaType,
} from '@prisma/client';
import type { EventMapInput, OccasionLinkRow } from '../types/events.types';

const NOW = new Date('2026-06-01T12:00:00.000Z');

export function makeOccasionLink(
  overrides: Partial<OccasionLinkRow> = {},
): OccasionLinkRow {
  return {
    usage: EventTypeOccasionUsage.OCCASION_SINGLE,
    sortOrder: 0,
    occasionType: { id: 'occ-1', name: 'Birthday', isActive: true },
    ...overrides,
  };
}

export function makeEventTypeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'et-1',
    name: 'Wedding',
    catalogChannel: EventTypeCatalogChannel.BOOKING,
    contactInquiryCode: 'WEDDING' as string | null,
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

export function makeEventRow(
  overrides: Partial<EventMapInput> & Record<string, unknown> = {},
): EventMapInput & Record<string, unknown> {
  const eventType = makeEventTypeRow(overrides.eventType ?? {});
  return {
    id: 'evt-1',
    eventTypeId: eventType.id,
    description: 'A signature celebration.',
    items: ['DJ', 'Lighting'],
    price: 1500,
    isActive: true,
    showOnHome: true,
    publicSection: EventPublicSection.GENERAL,
    slug: null,
    experienceType: null,
    classVariant: null,
    createdAt: NOW,
    updatedAt: NOW,
    galleryPhotos: [
      {
        id: 'ph-1',
        imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/hero.jpg',
        mediaType: GalleryMediaType.IMAGE,
      },
    ],
    eventType,
    ...overrides,
  };
}

export function makeCreateEventDto(overrides: Record<string, unknown> = {}) {
  return {
    eventTypeId: 'et-1',
    description: 'A signature celebration.',
    items: ['DJ', 'Lighting'],
    price: 1500,
    showOnHome: true,
    publicSection: EventPublicSection.GENERAL,
    ...overrides,
  };
}

export function makeOccasionTypeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'occ-1',
    name: 'Birthday',
    isActive: true,
    createdAt: NOW,
    updatedAt: NOW,
    _count: { bookings: 0, eventLinks: 0 },
    ...overrides,
  };
}

/** Venue config row shape for hub enrichment (`findHubVenueConfigs`). */
export function makeHubVenueConfigStub(
  overrides: Record<string, unknown> = {},
) {
  return {
    eventId: 'evt-1',
    clientEnabled: false,
    fixedTicketCapacity: null as number | null,
    reservationOpensAt: null as Date | null,
    reservationClosesAt: null as Date | null,
    reservationEventDate: null as Date | null,
    reservationTimezone: 'America/New_York',
    reservationEventTemplate: null as {
      scheduleMode: string;
    } | null,
    ...overrides,
  };
}
