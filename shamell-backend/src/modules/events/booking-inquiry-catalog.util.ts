import { EventPublicSection, Prisma } from '@prisma/client';

/** Active catalog events eligible for /contacto booking inquiry (not ON COMING hub). */
export const bookingInquiryCatalogEventWhere: Prisma.EventWhereInput = {
  isActive: true,
  publicSection: EventPublicSection.GENERAL,
  slug: null,
  experienceType: null,
  venueConfig: null,
  classSessions: { none: {} },
};

/** Any event row (active or not) that belongs to the ON COMING hub — its type must not appear in booking inquiry. */
export const onComingHubEventMarkerWhere: Prisma.EventWhereInput = {
  OR: [
    { publicSection: EventPublicSection.UPCOMING_EVENTS },
    { slug: { not: null } },
    { experienceType: { not: null } },
    { venueConfig: { isNot: null } },
    { classSessions: { some: {} } },
  ],
};

export async function eventTypeIdsExcludedFromBookingInquiry(
  prisma: { event: { findMany: (args: object) => Promise<{ eventTypeId: string }[]> } },
): Promise<string[]> {
  const rows = await prisma.event.findMany({
    where: onComingHubEventMarkerWhere,
    select: { eventTypeId: true },
  });
  return [...new Set(rows.map((r) => r.eventTypeId))];
}
