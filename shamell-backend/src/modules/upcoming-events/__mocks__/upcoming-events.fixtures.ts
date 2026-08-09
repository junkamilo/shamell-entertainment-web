export function makeUpcomingClassSessionStub(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'session-1',
    eventId: 'event-1',
    startsAt: new Date('2026-08-01T15:00:00.000Z'),
    endsAt: new Date('2026-08-01T16:00:00.000Z'),
    capacity: 20,
    price: 50,
    isActive: true,
    ...overrides,
  };
}

export function makeClassEnrollmentStub(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: 'enroll-1',
    sessionId: 'session-1',
    status: 'PENDING',
    stripeCheckoutSessionId: 'cs_test_1',
    customerEmail: 'guest@example.com',
    customerName: 'Guest',
    amount: 50,
    ...overrides,
  };
}

export function makeVenueConfigStub(overrides: Record<string, unknown> = {}) {
  return {
    eventId: 'event-1',
    clientEnabled: true,
    reservationEventTemplateId: 'template-1',
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
    ...overrides,
  };
}
