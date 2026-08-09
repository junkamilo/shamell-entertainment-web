import type { Prisma } from '@prisma/client';

export const bookingPaymentRelatedSelect = {
  id: true,
  status: true,
  expectedAmount: true,
  currency: true,
  paidAt: true,
  booking: { select: { user: { select: { email: true } } } },
} satisfies Prisma.BookingPaymentSelect;

export const classEnrollmentRelatedSelect = {
  id: true,
  status: true,
  amount: true,
  currency: true,
  paidAt: true,
  customerEmail: true,
} satisfies Prisma.UpcomingClassEnrollmentSelect;

export const packageEnrollmentRelatedSelect = {
  id: true,
  status: true,
  amount: true,
  currency: true,
  paidAt: true,
  customerEmail: true,
} satisfies Prisma.UpcomingClassPackageEnrollmentSelect;

export const fixedEnrollmentRelatedSelect = {
  id: true,
  status: true,
  amount: true,
  currency: true,
  paidAt: true,
  customerEmail: true,
} satisfies Prisma.UpcomingFixedEventEnrollmentSelect;

export const venueReservationRelatedSelect = {
  id: true,
  status: true,
  amount: true,
  currency: true,
  paidAt: true,
  customerEmail: true,
} satisfies Prisma.VenueSeatReservationSelect;
