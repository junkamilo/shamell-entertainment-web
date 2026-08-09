import {
  BookingPaymentStatus,
  BookingPaymentStage,
  UpcomingClassEnrollmentStatus,
  VenueSeatKind,
  VenueSeatReservationStatus,
} from '@prisma/client';
import type { AdminPaymentsQueryDto } from '../dto/admin-payments-query.dto';
import type { AdminStripePaymentDetail } from '../types/admin-payments-detail.types';
import type {
  AdminStripePaymentRow,
  PaymentListKey,
} from '../types/admin-payments.types';
import type {
  BookingPaymentRow,
  ClassRow,
  FixedRow,
  PackageRow,
  VenueRow,
} from '../utils/admin-payments-mapper.util';

const NOW = new Date('2026-07-01T15:00:00.000Z');

export function makeListQuery(
  overrides: Partial<AdminPaymentsQueryDto> = {},
): AdminPaymentsQueryDto {
  return {
    page: 1,
    limit: 20,
    ...overrides,
  };
}

export function makeUnionKey(
  overrides: Partial<PaymentListKey> & Pick<PaymentListKey, 'flow' | 'id'> = {
    flow: 'BOOKING_QUOTE',
    id: 'pay-1',
  },
): PaymentListKey {
  return {
    updated_at: NOW,
    ...overrides,
  };
}

export function makeAdminPaymentRow(
  overrides: Partial<AdminStripePaymentRow> = {},
): AdminStripePaymentRow {
  return {
    id: 'pay-1',
    flow: 'BOOKING_QUOTE',
    status: 'PAID',
    stage: 'DEPOSIT',
    amount: 150,
    currency: 'usd',
    customerName: 'Ada Lovelace',
    customerEmail: 'ada@example.com',
    contextLabel: 'Wedding',
    bookingId: 'booking-1',
    eventSlug: null,
    eventId: null,
    reservationId: null,
    stripeCheckoutSessionId: 'cs_test_1',
    paymentMethodLabel: null,
    createdAt: NOW.toISOString(),
    paidAt: NOW.toISOString(),
    expiresAt: null,
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

export function makePaymentDetail(
  overrides: Partial<AdminStripePaymentDetail> = {},
): AdminStripePaymentDetail {
  const base = makeAdminPaymentRow();
  return {
    ...base,
    customerPhone: '+15551212',
    purchaseDetails: {
      flow: 'BOOKING_QUOTE',
      eventType: 'Wedding',
      occasion: 'Anniversary',
      services: 'Dance · Live music',
      eventDate: NOW.toISOString(),
      location: 'Miami',
      guestCount: 80,
      quoteTotalAmount: 500,
      quoteDepositAmount: 150,
      quoteModel: 'DEPOSIT_BALANCE',
    },
    ...overrides,
  };
}

export function makeBookingPaymentRow(
  overrides: Partial<BookingPaymentRow> = {},
): BookingPaymentRow {
  return {
    id: 'bp-1',
    bookingId: 'booking-1',
    stage: BookingPaymentStage.DEPOSIT,
    status: BookingPaymentStatus.PAID,
    expectedAmount: 150 as never,
    currency: 'usd',
    stripeCheckoutSessionId: 'cs_test_bp',
    stripePaymentIntentId: null,
    paidAt: NOW,
    expiresAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    booking: {
      id: 'booking-1',
      eventId: null,
      eventTypeId: null,
      occasionTypeId: null,
      serviceId: null,
      userId: null,
      guestFullName: 'Ada Lovelace',
      guestEmail: 'ada@example.com',
      guestPhone: '+15551212',
      eventDate: NOW,
      location: 'Miami',
      guestCount: 80,
      quoteTotalAmount: 500 as never,
      quoteDepositAmount: 150 as never,
      quoteModel: 'DEPOSIT_BALANCE',
      bookingDetails: { serviceLabels: ['Dance', 'Live music'] },
      event: null,
      eventType: { name: 'Wedding' },
      occasionType: { name: 'Anniversary' },
      service: null,
      user: null,
    },
    ...overrides,
  } as BookingPaymentRow;
}

export function makeVenueRow(overrides: Partial<VenueRow> = {}): VenueRow {
  return {
    id: 'vsr-1',
    upcomingEventId: 'event-1',
    kind: VenueSeatKind.CATALOG_TABLE,
    layoutItemId: 'item-1',
    venueTableConfigId: 'table-1',
    status: VenueSeatReservationStatus.PAID,
    amount: 200 as never,
    currency: 'usd',
    customerName: 'Grace Hopper',
    customerEmail: 'grace@example.com',
    customerPhone: '+15550000',
    eventDate: NOW,
    stripeCheckoutSessionId: 'cs_test_vsr',
    paymentMethodType: 'card',
    paymentMethodBrand: 'visa',
    paymentMethodLast4: '4242',
    paidAt: NOW,
    expiresAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    upcomingEvent: {
      slug: 'gala',
      eventType: { name: 'Gala Night' },
    },
    venueTableConfig: {
      tableName: 'Table A1',
      size: 'LARGE',
    },
    ...overrides,
  } as VenueRow;
}

export function makeClassRow(overrides: Partial<ClassRow> = {}): ClassRow {
  return {
    id: 'uce-1',
    status: UpcomingClassEnrollmentStatus.PAID,
    amount: 75 as never,
    currency: 'usd',
    customerName: 'Marie Curie',
    customerEmail: 'marie@example.com',
    customerPhone: null,
    stripeCheckoutSessionId: 'cs_test_uce',
    paymentMethodType: null,
    paymentMethodBrand: null,
    paymentMethodLast4: null,
    paidAt: NOW,
    expiresAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    session: {
      startsAt: NOW,
      endsAt: new Date(NOW.getTime() + 3600_000),
      timezone: 'America/New_York',
      event: {
        id: 'event-class-1',
        slug: 'bachata',
        eventType: { name: 'Bachata', id: 'et-1' },
      },
    },
    ...overrides,
  } as ClassRow;
}

export function makeFixedRow(overrides: Partial<FixedRow> = {}): FixedRow {
  return {
    id: 'ufe-1',
    status: UpcomingClassEnrollmentStatus.PAID,
    amount: 40 as never,
    currency: 'usd',
    customerName: 'Alan Turing',
    customerEmail: 'alan@example.com',
    customerPhone: null,
    ticketNumber: 12,
    stripeCheckoutSessionId: 'cs_test_ufe',
    paymentMethodType: null,
    paymentMethodBrand: null,
    paymentMethodLast4: null,
    paidAt: NOW,
    expiresAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    event: {
      id: 'event-fixed-1',
      slug: 'show-night',
      eventType: { name: 'Show Night', id: 'et-2' },
      venueConfig: {
        reservationEventDate: NOW,
        reservationTimezone: 'America/New_York',
      },
    },
    ...overrides,
  } as FixedRow;
}

export function makePackageRow(
  overrides: Partial<PackageRow> = {},
): PackageRow {
  return {
    id: 'ucp-1',
    status: UpcomingClassEnrollmentStatus.PAID,
    amount: 300 as never,
    currency: 'usd',
    customerName: 'Katherine Johnson',
    customerEmail: 'kathy@example.com',
    stripeCheckoutSessionId: 'cs_test_ucp',
    paymentMethodType: null,
    paymentMethodBrand: null,
    paymentMethodLast4: null,
    paidAt: NOW,
    expiresAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    selections: { kind: 'class_month_package', sessionCount: 4 },
    event: {
      id: 'event-pkg-1',
      slug: 'salsa-pkg',
      eventType: { name: 'Salsa', id: 'et-3' },
    },
    items: [{ id: 'item-1' }, { id: 'item-2' }],
    ...overrides,
  } as PackageRow;
}
