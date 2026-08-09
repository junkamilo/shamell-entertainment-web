import { Prisma } from '@prisma/client';

/** Admin list/detail — full relations including creator admin. */
export const adminListInclude = {
  service: { include: { serviceType: true } },
  bookingServices: {
    orderBy: { sortOrder: 'asc' as const },
    include: { service: { include: { serviceType: true } } },
  },
  eventType: true,
  occasionType: true,
  event: true,
  user: true,
  createdByAdmin: { select: { id: true, fullName: true, email: true } },
} satisfies Prisma.BookingInclude;

/** Contact inbox feed — same relations without createdByAdmin. */
export const feedInclude = {
  service: { include: { serviceType: true } },
  eventType: true,
  occasionType: true,
  event: true,
  user: true,
} satisfies Prisma.BookingInclude;

export type BookingWithRelations = Prisma.BookingGetPayload<{
  include: typeof adminListInclude;
}>;

/** Week calendar view — lighter relations for mi-agenda. */
export const calendarInclude = {
  service: { select: { id: true, serviceType: { select: { name: true } } } },
  eventType: { select: { id: true, name: true } },
  occasionType: { select: { id: true, name: true } },
  event: { select: { id: true } },
  user: { select: { fullName: true, email: true } },
} satisfies Prisma.BookingInclude;

export type BookingCalendarRow = Prisma.BookingGetPayload<{
  include: typeof calendarInclude;
}>;
