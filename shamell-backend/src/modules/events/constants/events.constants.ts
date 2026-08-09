import type { Prisma } from '@prisma/client';

/** Active gallery rows for public catalog (no id). */
export const activeGalleryPhotoSelect = {
  where: { isActive: true },
  orderBy: { createdAt: 'asc' as const },
  select: { imageUrl: true, mediaType: true },
} satisfies Prisma.Event$galleryPhotosArgs;

/** Active gallery rows for admin (includes id). */
export const activeGalleryPhotoAdminSelect = {
  where: { isActive: true },
  orderBy: { createdAt: 'asc' as const },
  select: { id: true, imageUrl: true, mediaType: true },
} satisfies Prisma.Event$galleryPhotosArgs;

/** Hero-only gallery take for upcoming hub cards. */
export const activeGalleryPhotoHeroTake1 = {
  where: { isActive: true },
  orderBy: { createdAt: 'asc' as const },
  take: 1,
  select: { imageUrl: true, mediaType: true },
} satisfies Prisma.Event$galleryPhotosArgs;

/** Active occasion links nested under event type (contact lines). */
export const activeOccasionLinksInclude = {
  where: { occasionType: { isActive: true } },
  orderBy: [{ sortOrder: 'asc' as const }],
  include: {
    occasionType: {
      select: { id: true, name: true, isActive: true },
    },
  },
} satisfies Prisma.EventType$occasionLinksArgs;

/** Full occasion links for admin event-type payloads. */
export const adminOccasionLinksInclude = {
  orderBy: [{ sortOrder: 'asc' as const }],
  include: { occasionType: true },
} satisfies Prisma.EventType$occasionLinksArgs;

export const eventWithTypeAndGalleryInclude = {
  eventType: true,
  galleryPhotos: activeGalleryPhotoSelect,
} satisfies Prisma.EventInclude;

export const eventWithTypeAndGalleryAdminInclude = {
  eventType: true,
  galleryPhotos: activeGalleryPhotoAdminSelect,
} satisfies Prisma.EventInclude;

export const eventWithTypeAndHeroGalleryInclude = {
  eventType: true,
  galleryPhotos: activeGalleryPhotoHeroTake1,
} satisfies Prisma.EventInclude;

export const contactLineEventInclude = {
  galleryPhotos: activeGalleryPhotoSelect,
  eventType: {
    include: {
      occasionLinks: activeOccasionLinksInclude,
    },
  },
} satisfies Prisma.EventInclude;

export const orphanEventTypeInclude = {
  occasionLinks: activeOccasionLinksInclude,
} satisfies Prisma.EventTypeInclude;

export const eventTypeAdminInclude = {
  occasionLinks: adminOccasionLinksInclude,
  _count: {
    select: { events: true, bookings: true, galleryPhotos: true },
  },
} satisfies Prisma.EventTypeInclude;

export const eventTypeAdminReloadInclude = {
  occasionLinks: adminOccasionLinksInclude,
} satisfies Prisma.EventTypeInclude;

export const adminEventListInclude = {
  eventType: true,
  galleryPhotos: activeGalleryPhotoAdminSelect,
  _count: {
    select: { bookings: true, galleryPhotos: true },
  },
} satisfies Prisma.EventInclude;

export const hubVenueConfigSelect = {
  eventId: true,
  clientEnabled: true,
  fixedTicketCapacity: true,
  reservationOpensAt: true,
  reservationClosesAt: true,
  reservationEventDate: true,
  reservationTimezone: true,
  reservationEventTemplate: {
    select: { scheduleMode: true },
  },
} satisfies Prisma.UpcomingVenueConfigSelect;

/** Seat reservation statuses that block event delete. */
export const ACTIVE_SEAT_RESERVATION_STATUSES = [
  'PAID',
  'PENDING_PAYMENT',
] as const;

/** Class enrollment statuses that block event delete. */
export const ACTIVE_CLASS_ENROLLMENT_STATUSES = [
  'PAID',
  'PENDING_PAYMENT',
] as const;
