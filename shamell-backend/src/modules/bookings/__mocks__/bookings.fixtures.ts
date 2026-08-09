import { BookingSource, BookingStatus } from '@prisma/client';
import type { BookingWithRelations } from '../constants/booking-includes';

const NOW = new Date('2026-07-15T16:00:00.000Z');

export function makeBookingWithRelations(
  overrides: Partial<BookingWithRelations> = {},
): BookingWithRelations {
  return {
    id: 'booking-1',
    serviceId: 'service-1',
    eventTypeId: null,
    occasionTypeId: null,
    eventId: null,
    eventDate: NOW,
    location: 'Miami Beach',
    guestCount: 20,
    notes: null,
    status: BookingStatus.PENDING,
    bookingDetails: null,
    source: BookingSource.ADMIN_PHONE,
    createdByAdminId: 'admin-1',
    contactRequestId: null,
    userId: null,
    guestFullName: 'Ada Lovelace',
    guestEmail: 'ada@example.com',
    guestPhone: '+15551212',
    totalAmount: null,
    quoteModel: null,
    quoteTotalAmount: null,
    quoteDepositAmount: null,
    quoteBalanceAmount: null,
    quoteCurrency: null,
    quoteSentAt: null,
    quoteAcceptedAt: null,
    quoteRejectedAt: null,
    depositPaidAt: null,
    balancePaidAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    service: {
      id: 'service-1',
      serviceType: { id: 'st-1', name: 'Performance' } as never,
    } as never,
    bookingServices: [],
    eventType: null,
    occasionType: null,
    event: null,
    user: null,
    createdByAdmin: {
      id: 'admin-1',
      fullName: 'Admin',
      email: 'admin@example.com',
    },
    ...overrides,
  } as BookingWithRelations;
}

export function makeOccupiedPayload(
  date = '2026-07-15',
  occupied: Array<{ startMinutes: number; endMinutes: number }> = [
    { startMinutes: 600, endMinutes: 720 },
  ],
) {
  return { date, occupied };
}
