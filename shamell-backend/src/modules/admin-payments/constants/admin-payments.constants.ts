import { Prisma } from '@prisma/client';
import type {
  AdminPaymentFlow,
  AdminPaymentStatus,
} from '../dto/admin-payments-query.dto';

export const TERMINAL_STATUSES: AdminPaymentStatus[] = [
  'PAID',
  'EXPIRED',
  'CANCELLED',
];

export const ALL_PAYMENT_FLOWS: AdminPaymentFlow[] = [
  'BOOKING_QUOTE',
  'VENUE_SEAT',
  'CLASS_SESSION',
  'CLASS_PACKAGE',
  'CLASS_DAY_BUNDLE',
  'FIXED_TICKET',
];

export const bookingPaymentInclude = {
  booking: {
    include: {
      event: { include: { eventType: { select: { name: true } } } },
      eventType: { select: { name: true } },
      occasionType: { select: { name: true } },
      service: { include: { serviceType: { select: { name: true } } } },
      user: { select: { fullName: true, email: true } },
    },
  },
} satisfies Prisma.BookingPaymentInclude;

export const venueInclude = {
  upcomingEvent: { include: { eventType: { select: { name: true } } } },
  venueTableConfig: { select: { tableName: true, size: true } },
} satisfies Prisma.VenueSeatReservationInclude;

export const classInclude = {
  session: {
    include: {
      event: { include: { eventType: { select: { name: true, id: true } } } },
    },
  },
} satisfies Prisma.UpcomingClassEnrollmentInclude;

export const fixedInclude = {
  event: {
    include: {
      eventType: { select: { name: true, id: true } },
      venueConfig: {
        select: { reservationEventDate: true, reservationTimezone: true },
      },
    },
  },
} satisfies Prisma.UpcomingFixedEventEnrollmentInclude;

export const packageInclude = {
  event: {
    select: {
      id: true,
      slug: true,
      eventType: { select: { name: true, id: true } },
    },
  },
  items: { select: { id: true } },
} satisfies Prisma.UpcomingClassPackageEnrollmentInclude;
