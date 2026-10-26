import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';

/** Tables touched by the admin-payments security/load seed (TRUNCATE ... CASCADE). */
export const ADMIN_PAYMENTS_TABLES = [
  'venue_seat_reservations',
  'upcoming_fixed_event_enrollments',
  'events',
  'event_types',
  'users',
] as const;

/** Secret-like value that must never appear in an admin payments response. */
export const SEEDED_PAY_TOKEN_HASH = 'pay-token-hash-must-not-leak';

const STATUSES = ['PENDING_PAYMENT', 'PAID', 'EXPIRED', 'CANCELLED'] as const;
const BATCH = 1_000;

export type SeededPayments = {
  eventId: string;
  venueIds: string[];
  fixedIds: string[];
  /** A PAID venue reservation whose customer is `victimEmail`. */
  victimVenueId: string;
  victimEmail: string;
};

/**
 * Inserts a realistic volume of real payment rows (venue seats + fixed
 * tickets) spread across statuses, customers and the last 90 days, so list,
 * search, badge and detail queries run against a non-trivial table.
 */
export async function seedPaymentsVolume(
  prisma: PrismaClient,
  opts: { venue: number; fixed: number },
): Promise<SeededPayments> {
  const eventType = await prisma.eventType.create({
    data: { name: `Load Fixed ${randomUUID()}` },
  });
  const event = await prisma.event.create({
    data: {
      eventTypeId: eventType.id,
      description: 'Admin payments load seed',
      slug: `load-fixed-${randomUUID()}`,
    },
  });

  const now = Date.now();
  const at = (i: number) => new Date(now - (i % 90) * 86_400_000 - i * 1_000);

  const venueRows = Array.from({ length: opts.venue }, (_, i) => {
    const status = STATUSES[i % STATUSES.length];
    return {
      id: randomUUID(),
      kind: i % 2 === 0 ? 'CATALOG_TABLE' : 'STANDALONE_CHAIR',
      layoutItemId: `load-item-${i}`,
      eventDate: at(i),
      amount: 50 + (i % 200),
      status,
      stripeCheckoutSessionId: `cs_load_venue_${i}`,
      payTokenHash: SEEDED_PAY_TOKEN_HASH,
      customerName: `Load Customer ${i}`,
      customerEmail: `customer${i}@load.test`,
      paidAt: status === 'PAID' ? at(i) : null,
      updatedAt: at(i),
    } as const;
  });

  const fixedRows = Array.from({ length: opts.fixed }, (_, i) => ({
    id: randomUUID(),
    eventId: event.id,
    status: STATUSES[i % STATUSES.length],
    amount: 30 + (i % 50),
    stripeCheckoutSessionId: `cs_load_fixed_${i}`,
    customerName: `Fixed Customer ${i}`,
    customerEmail: `fixed${i}@load.test`,
    ticketNumber: i + 1,
    updatedAt: at(i),
  }));

  for (let i = 0; i < venueRows.length; i += BATCH) {
    await prisma.venueSeatReservation.createMany({
      data: venueRows.slice(i, i + BATCH),
    });
  }
  for (let i = 0; i < fixedRows.length; i += BATCH) {
    await prisma.upcomingFixedEventEnrollment.createMany({
      data: fixedRows.slice(i, i + BATCH),
    });
  }

  const victim = venueRows.find((r) => r.status === 'PAID');
  if (!victim) throw new Error('Seed needs at least one PAID venue row');

  return {
    eventId: event.id,
    venueIds: venueRows.map((r) => r.id),
    fixedIds: fixedRows.map((r) => r.id),
    victimVenueId: victim.id,
    victimEmail: victim.customerEmail,
  };
}
