import { BadRequestException } from '@nestjs/common';
import { ReservationEventScheduleMode } from '@prisma/client';
import {
  assertCanonicalEventNightForCheckout,
  canonicalEventNightFromVenueConfig,
  resolveCanonicalReservationEventDate,
} from './resolve-canonical-reservation-event-date.util';

describe('resolve-canonical-reservation-event-date.util', () => {
  const salesOpen = new Date('2026-06-11T04:00:00.000Z');
  const salesClose = new Date('2026-08-16T03:59:59.999Z');
  const eventNight = new Date('2026-08-15T22:00:00.000Z');

  it('prefers reservationEventDate over sales open', () => {
    const result = canonicalEventNightFromVenueConfig({
      reservationOpensAt: salesOpen,
      reservationClosesAt: salesClose,
      reservationEventDate: eventNight,
    });
    expect(result).toEqual(eventNight);
  });

  it('derives event night from FIXED_EVENT template when config date is missing', () => {
    const result = canonicalEventNightFromVenueConfig({
      reservationOpensAt: salesOpen,
      reservationClosesAt: salesClose,
      reservationEventDate: null,
      reservationEventTemplate: {
        name: 'Gala',
        timezone: 'America/New_York',
        scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
        salesStartDate: new Date('2026-06-11T12:00:00.000Z'),
        salesEndDate: new Date('2026-08-15T12:00:00.000Z'),
        eventDate: new Date('2026-08-15T12:00:00.000Z'),
        eventStartTime: '18:00',
        eventEndTime: '22:00',
        recurringEffectiveFrom: null,
        recurringStartTime: null,
        recurringEndTime: null,
      },
    });
    expect(result).not.toBeNull();
    expect(result!.getTime()).not.toBe(salesOpen.getTime());
    expect(result!.toISOString()).toContain('2026-08-15');
  });

  it('does not use sales open as event night for FIXED_EVENT without config or template date', () => {
    const result = canonicalEventNightFromVenueConfig({
      reservationOpensAt: salesOpen,
      reservationClosesAt: salesClose,
      reservationEventDate: null,
      reservationEventTemplate: {
        name: 'Gala',
        timezone: 'America/New_York',
        scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
        salesStartDate: null,
        salesEndDate: null,
        eventDate: null,
        eventStartTime: null,
        eventEndTime: null,
        recurringEffectiveFrom: null,
        recurringStartTime: null,
        recurringEndTime: null,
      },
    });
    expect(result).toBeNull();
  });

  it('rejects FIXED_EVENT checkout when event night is missing', () => {
    expect(() =>
      assertCanonicalEventNightForCheckout({
        reservationOpensAt: salesOpen,
        reservationClosesAt: salesClose,
        reservationEventDate: null,
        reservationEventTemplate: {
          name: 'Gala',
          timezone: 'America/New_York',
          scheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
          salesStartDate: null,
          salesEndDate: null,
          eventDate: null,
          eventStartTime: null,
          eventEndTime: null,
          recurringEffectiveFrom: null,
          recurringStartTime: null,
          recurringEndTime: null,
        },
      }),
    ).toThrow(BadRequestException);
  });

  it('falls back to stored row date when config has no event night', async () => {
    const stored = new Date('2026-08-15T22:00:00.000Z');
    const prisma = {
      upcomingVenueConfig: {
        findUnique: async () => null,
      },
      venueLayoutClientSettings: {
        findFirst: async () => ({
          reservationOpensAt: salesOpen,
          reservationClosesAt: salesClose,
          reservationEventDate: null,
        }),
      },
    };
    const result = await resolveCanonicalReservationEventDate(prisma, {
      upcomingEventId: 'evt-1',
      storedEventDate: stored,
    });
    expect(result).toEqual(salesOpen);
  });

  /**
   * Production QA (post-deploy):
   * 1. Admin FIXED_EVENT template: Event date = Aug 15, 2026 → Save template
   * 2. Admin venue-config API: reservationEventDate ≈ Aug 15 (not Jun 11)
   * 3. Test reservation → confirmation email shows Saturday, August 15, 2026
   * 4. DB: venue_seat_reservations PAID rows (e.g. Rossy) eventDate synced to August
   * 5. Admin reservations list shows August event date
   */
});
