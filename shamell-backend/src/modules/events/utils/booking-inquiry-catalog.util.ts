import {
  EventPublicSection,
  EventTypeCatalogChannel,
  Prisma,
} from '@prisma/client';

/** Active catalog events eligible for /contacto booking inquiry (not ON COMING hub). */
export const bookingInquiryCatalogEventWhere: Prisma.EventWhereInput = {
  isActive: true,
  publicSection: EventPublicSection.GENERAL,
  eventType: { catalogChannel: EventTypeCatalogChannel.BOOKING },
};

/** Events that belong to the ON COMING hub (typed section only). */
export const onComingHubEventWhere: Prisma.EventWhereInput = {
  publicSection: EventPublicSection.UPCOMING_EVENTS,
};

/** Map Event.publicSection → EventType.catalogChannel. */
export function catalogChannelForPublicSection(
  section: EventPublicSection,
): EventTypeCatalogChannel {
  return section === EventPublicSection.UPCOMING_EVENTS
    ? EventTypeCatalogChannel.UPCOMING_HUB
    : EventTypeCatalogChannel.BOOKING;
}

/** EventType filter by typed catalog channel (source of truth). */
export function eventTypeWhereForChannel(
  channel: EventTypeCatalogChannel,
): Prisma.EventTypeWhereInput {
  return { catalogChannel: channel };
}

/**
 * EventType filter for admin lists and Agendar by public section.
 * GENERAL → BOOKING channel; UPCOMING_EVENTS → UPCOMING_HUB channel.
 */
export function adminEventTypesWhereForSection(
  section: EventPublicSection,
): Prisma.EventTypeWhereInput {
  return eventTypeWhereForChannel(catalogChannelForPublicSection(section));
}

/** Active event types eligible for Admin Agendar / bookings (not ON COMING hub). */
export function bookingEligibleEventTypesWhere(): Prisma.EventTypeWhereInput {
  return {
    isActive: true,
    catalogChannel: EventTypeCatalogChannel.BOOKING,
  };
}

/** Event list filter: section + matching type channel (defense in depth). */
export function eventsWhereForPublicSection(
  section: EventPublicSection,
): Prisma.EventWhereInput {
  return {
    publicSection: section,
    eventType: {
      catalogChannel: catalogChannelForPublicSection(section),
    },
  };
}
