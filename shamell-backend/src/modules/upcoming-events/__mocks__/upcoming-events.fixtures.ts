import {
  EventPublicSection,
  ReservationEventScheduleMode,
  UpcomingClassEnrollmentStatus,
  UpcomingExperienceType,
} from '@prisma/client';

export function makeUpcomingClassSessionStub(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'session-1',
    eventId: 'event-1',
    startsAt: new Date('2026-08-01T15:00:00.000Z'),
    endsAt: new Date('2026-08-01T16:00:00.000Z'),
    timezone: 'America/New_York',
    capacity: 20,
    price: 50,
    currency: 'usd',
    isActive: true,
    weekday: 1,
    sortOrder: 0,
    sectionId: 'section-1',
    ...overrides,
  };
}

export function makeClassEnrollmentStub(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'enroll-1',
    sessionId: 'session-1',
    status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
    stripeCheckoutSessionId: 'cs_test_1',
    customerEmail: 'guest@example.com',
    customerName: 'Guest',
    amount: 50,
    currency: 'usd',
    customerEmailSentAt: null,
    ...overrides,
  };
}

/** Class enrollment row as returned by webhook findUnique (with session include). */
export function makeClassEnrollmentWebhookInclude(
  overrides: Record<string, unknown> = {},
) {
  const { session: sessionOverride, ...rest } = overrides;
  return {
    ...makeClassEnrollmentStub({
      status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
      amount: 50,
      currency: 'usd',
      customerEmailSentAt: null,
    }),
    session: {
      startsAt: new Date('2026-08-15T15:00:00.000Z'),
      endsAt: new Date('2026-08-15T16:00:00.000Z'),
      timezone: 'America/New_York',
      section: null,
      event: {
        slug: 'salsa-night',
        eventType: { name: 'Salsa Night' },
      },
      ...(sessionOverride as Record<string, unknown> | undefined),
    },
    ...rest,
  };
}

/** Package enrollment with N child items for webhook money paths. */
export function makeClassPackageWebhookInclude(
  args: {
    itemCount?: number;
    overrides?: Record<string, unknown>;
  } = {},
) {
  const itemCount = args.itemCount ?? 2;
  const childSession = {
    startsAt: new Date('2026-08-15T15:00:00.000Z'),
    endsAt: new Date('2026-08-15T16:00:00.000Z'),
    timezone: 'America/New_York',
    section: null,
    event: { eventType: { name: 'Salsa Night' }, slug: 'salsa-night' },
  };
  const items = Array.from({ length: itemCount }, (_, i) => {
    const id = `child-${i + 1}`;
    return {
      enrollmentId: id,
      weekday: i + 1,
      enrollment: {
        id,
        customerName: 'Pkg Guest',
        customerEmail: 'pkg@example.com',
        amount: 50,
        currency: 'usd',
        session: childSession,
      },
    };
  });
  return {
    ...makeClassPackageEnrollmentStub({
      amount: itemCount * 50,
      customerName: 'Pkg Guest',
      customerEmail: 'pkg@example.com',
      customerEmailSentAt: null,
    }),
    event: { eventType: { name: 'Salsa Night' }, slug: 'salsa-night' },
    items,
    ...args.overrides,
  };
}

/** Fixed ticket enrollment as returned by webhook findUnique. */
export function makeFixedEnrollmentWebhookInclude(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'fixed-enroll-1',
    eventId: 'event-fixed-1',
    status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
    amount: 25,
    currency: 'usd',
    customerName: 'Fixed Guest',
    customerEmail: 'fixed@example.com',
    customerEmailSentAt: null,
    adminNotifySentAt: null,
    ticketNumber: null,
    stripeCheckoutSessionId: 'cs_fixed_1',
    event: {
      slug: 'gala-night',
      eventType: { name: 'Gala Night' },
    },
    ...overrides,
  };
}

export function makeVenueConfigStub(overrides: Record<string, unknown> = {}) {
  return {
    eventId: 'event-1',
    clientEnabled: true,
    reservationEventTemplateId: 'template-1',
    classPackageEnabled: true,
    classPackagePrice: 120,
    classPackageLabel: 'Month pack',
    fixedTicketCapacity: 50,
    ...overrides,
  };
}

export function makePublicEventStub(overrides: Record<string, unknown> = {}) {
  return {
    id: 'event-1',
    slug: 'salsa-night',
    name: 'Salsa Night',
    description: 'Public upcoming event',
    isActive: true,
    experienceType: UpcomingExperienceType.CLASSES,
    ...overrides,
  };
}

export function makeClassesEventStub(overrides: Record<string, unknown> = {}) {
  return makePublicEventStub({
    experienceType: UpcomingExperienceType.CLASSES,
    ...overrides,
  });
}

export function makeStripeCheckoutSessionLite(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'cs_test_1',
    status: 'complete',
    payment_status: 'paid',
    amount_total: 5000,
    currency: 'usd',
    metadata: { flow: 'class_session' },
    payment_intent: 'pi_test_1',
    ...overrides,
  };
}

export function makeRecurringTemplateStub(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'template-1',
    timezone: 'America/New_York',
    scheduleMode: 'RECURRING_WEEKLY',
    recurringEffectiveFrom: new Date('2026-06-01T00:00:00.000Z'),
    recurringStartTime: '10:00',
    recurringEndTime: '12:00',
    weekdays: [
      { weekday: 1, isActive: true },
      { weekday: 3, isActive: true },
    ],
    classSections: [
      {
        id: 'section-1',
        weekday: 1,
        isActive: true,
        startTime: '10:00',
        endTime: '12:00',
        sortOrder: 0,
        defaultCapacity: 20,
        defaultPrice: 50,
        label: 'Section A',
      },
    ],
    ...overrides,
  };
}

export function makeFutureClassSessionStub(
  overrides: Record<string, unknown> = {},
) {
  return makeUpcomingClassSessionStub({
    endsAt: new Date(Date.now() + 86_400_000),
    startsAt: new Date(Date.now() + 86_400_000 - 3_600_000),
    ...overrides,
  });
}

export function makeEndedClassSessionStub(
  overrides: Record<string, unknown> = {},
) {
  return makeUpcomingClassSessionStub({
    startsAt: new Date('2020-01-01T15:00:00.000Z'),
    endsAt: new Date('2020-01-01T16:00:00.000Z'),
    ...overrides,
  });
}

export function makeMonthPackageVenueConfigStub(
  overrides: Record<string, unknown> = {},
) {
  return makeVenueConfigStub({
    classPackageEnabled: true,
    classPackagePrice: 120,
    classPackageLabel: 'Full month',
    reservationEventTemplate: {
      scheduleMode: 'RECURRING_WEEKLY',
      timezone: 'America/New_York',
      weekdays: [{ weekday: 1, isActive: true }],
    },
    ...overrides,
  });
}

export function makeClassPackageEnrollmentStub(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'pkg-1',
    eventId: 'event-1',
    status: UpcomingClassEnrollmentStatus.PENDING_PAYMENT,
    stripeCheckoutSessionId: 'cs_pkg_1',
    payTokenHash: 'hash-1',
    amount: 100,
    currency: 'usd',
    customerName: 'Guest',
    customerEmail: 'guest@example.com',
    expiresAt: new Date(Date.now() + 86_400_000),
    ...overrides,
  };
}

export function makeClassesPublicEventStub(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'event-1',
    slug: 'salsa-night',
    experienceType: UpcomingExperienceType.CLASSES,
    eventType: { name: 'Salsa Night' },
    price: 50,
    ...overrides,
  };
}

export function makeCheckoutClassSessionStub(
  overrides: Record<string, unknown> = {},
) {
  return makeFutureClassSessionStub({
    id: 'session-1',
    eventId: 'event-1',
    capacity: 20,
    price: 50,
    currency: 'usd',
    timezone: 'America/New_York',
    weekday: 1,
    sectionId: null,
    section: null,
    ...overrides,
  });
}

export function makeMonthPackageVenueEnabledStub(
  overrides: Record<string, unknown> = {},
) {
  return makeMonthPackageVenueConfigStub({
    classPackageEnabled: true,
    classPackagePrice: 120,
    classPackageLabel: 'Full month',
    reservationTimezone: 'America/New_York',
    reservationEventTemplate: {
      scheduleMode: ReservationEventScheduleMode.RECURRING_WEEKLY,
      timezone: 'America/New_York',
      weekdays: [{ weekday: 1, isActive: true }],
    },
    ...overrides,
  });
}

export function makeFixedPublicCheckoutVenueStub(
  overrides: Record<string, unknown> = {},
) {
  return {
    eventId: 'fixed-event-1',
    clientEnabled: false,
    fixedTicketCapacity: 50,
    reservationOpensAt: new Date('2020-01-01T00:00:00.000Z'),
    reservationClosesAt: new Date('2099-12-31T00:00:00.000Z'),
    reservationEventDate: new Date('2026-12-01T00:00:00.000Z'),
    reservationTimezone: 'America/New_York',
    reservationEventLabel: 'Gala Night',
    reservationEventTemplate: {
      scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
    },
    ...overrides,
  };
}

/** Active fixed-ticket upcoming event for admin box-office cash/checkout. */
export function makeFixedTicketEventStub(
  overrides: Record<string, unknown> = {},
) {
  const { venueConfig: venueConfigOverride, ...rest } = overrides;
  const venueOverrides =
    (venueConfigOverride as Record<string, unknown> | undefined) ?? {};
  const templateOverrides =
    (venueOverrides.reservationEventTemplate as
      | Record<string, unknown>
      | undefined) ?? {};

  return {
    id: 'fixed-event-1',
    slug: 'gala-night',
    price: 75,
    isActive: true,
    publicSection: EventPublicSection.UPCOMING_EVENTS,
    experienceType: UpcomingExperienceType.VENUE_SEATING,
    eventType: { name: 'Gala Night' },
    ...rest,
    venueConfig: makeVenueConfigStub({
      eventId: 'fixed-event-1',
      clientEnabled: false,
      fixedTicketCapacity: 50,
      reservationEventDate: new Date('2026-09-01T00:00:00.000Z'),
      reservationEventLabel: 'Gala Night',
      reservationOpensAt: new Date('2026-01-01T00:00:00.000Z'),
      reservationClosesAt: new Date('2026-12-31T00:00:00.000Z'),
      reservationTimezone: 'America/New_York',
      floorLayoutId: null,
      ...venueOverrides,
      reservationEventTemplate: {
        scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
        ...templateOverrides,
      },
    }),
  };
}
