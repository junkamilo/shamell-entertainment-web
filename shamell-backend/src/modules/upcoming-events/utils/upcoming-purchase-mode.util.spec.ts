import {
  ReservationEventScheduleMode,
  UpcomingExperienceType,
} from '@prisma/client';
import { resolveUpcomingPurchaseContext } from './upcoming-purchase-mode.util';

describe('resolveUpcomingPurchaseContext', () => {
  it('returns classes mode when experience is CLASSES', () => {
    expect(
      resolveUpcomingPurchaseContext({
        experienceType: UpcomingExperienceType.CLASSES,
        price: 50,
        clientEnabled: false,
        templateScheduleMode: null,
        reservationOpensAt: null,
        reservationClosesAt: null,
        reservationEventDate: null,
        hasActiveSessions: true,
      }),
    ).toEqual({
      purchaseMode: 'classes',
      salesOpen: false,
      purchasable: true,
      ticketMode: 'SINGLE',
      packages: [],
    });
  });

  it('returns venue_seating when clientEnabled seating', () => {
    const opens = new Date(Date.now() - 86400000);
    const closes = new Date(Date.now() + 86400000);
    const result = resolveUpcomingPurchaseContext({
      experienceType: UpcomingExperienceType.VENUE_SEATING,
      price: null,
      clientEnabled: true,
      templateScheduleMode: null,
      reservationOpensAt: opens,
      reservationClosesAt: closes,
      reservationEventDate: closes,
    });
    expect(result.purchaseMode).toBe('venue_seating');
    expect(result.purchasable).toBe(result.salesOpen);
  });

  it('returns fixed_ticket when FIXED_EVENT and not clientEnabled', () => {
    const opens = new Date(Date.now() - 86400000);
    const closes = new Date(Date.now() + 86400000);
    const result = resolveUpcomingPurchaseContext({
      experienceType: null,
      price: 25,
      clientEnabled: false,
      templateScheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
      reservationOpensAt: opens,
      reservationClosesAt: closes,
      reservationEventDate: closes,
      ticketsRemaining: 3,
    });
    expect(result.purchaseMode).toBe('fixed_ticket');
    expect(result.purchasable).toBe(result.salesOpen);
  });

  it('returns none for unmatched context', () => {
    expect(
      resolveUpcomingPurchaseContext({
        experienceType: null,
        price: null,
        clientEnabled: false,
        templateScheduleMode: null,
        reservationOpensAt: null,
        reservationClosesAt: null,
        reservationEventDate: null,
      }),
    ).toEqual({
      purchaseMode: 'none',
      salesOpen: false,
      purchasable: false,
      ticketMode: 'SINGLE',
      packages: [],
    });
  });

  it('fixed_ticket not purchasable when sold out', () => {
    const opens = new Date(Date.now() - 86400000);
    const closes = new Date(Date.now() + 86400000);
    const result = resolveUpcomingPurchaseContext({
      experienceType: null,
      price: 25,
      clientEnabled: false,
      templateScheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
      reservationOpensAt: opens,
      reservationClosesAt: closes,
      reservationEventDate: closes,
      ticketsRemaining: 0,
    });
    expect(result.purchaseMode).toBe('fixed_ticket');
    expect(result.purchasable).toBe(false);
  });

  it('rescues not_started window when date-only window is open in timezone', () => {
    const opens = new Date(Date.now() + 2 * 3600000);
    const closes = new Date(Date.now() + 20 * 3600000);
    const result = resolveUpcomingPurchaseContext({
      experienceType: null,
      price: 25,
      clientEnabled: false,
      templateScheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
      reservationOpensAt: opens,
      reservationClosesAt: closes,
      reservationEventDate: closes,
      reservationTimezone: 'America/New_York',
      ticketsRemaining: 5,
    });
    expect(result.purchaseMode).toBe('fixed_ticket');
    expect(result.salesOpen).toBe(true);
    expect(result.purchasable).toBe(true);
  });

  it('date-only fallback uses America/New_York when timezone omitted', () => {
    const opens = new Date(Date.now() + 2 * 3600000);
    const closes = new Date(Date.now() + 20 * 3600000);
    const result = resolveUpcomingPurchaseContext({
      experienceType: UpcomingExperienceType.VENUE_SEATING,
      price: null,
      clientEnabled: true,
      templateScheduleMode: null,
      reservationOpensAt: opens,
      reservationClosesAt: closes,
      reservationEventDate: closes,
      reservationTimezone: null,
    });
    expect(result.purchaseMode).toBe('venue_seating');
    expect(result.salesOpen).toBe(true);
    expect(result.purchasable).toBe(true);
  });

  it('fixed_ticket not purchasable when price below 0.5', () => {
    const opens = new Date(Date.now() - 86400000);
    const closes = new Date(Date.now() + 86400000);
    const result = resolveUpcomingPurchaseContext({
      experienceType: null,
      price: 0.49,
      clientEnabled: false,
      templateScheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
      reservationOpensAt: opens,
      reservationClosesAt: closes,
      reservationEventDate: closes,
      ticketsRemaining: 10,
    });
    expect(result.purchaseMode).toBe('fixed_ticket');
    expect(result.salesOpen).toBe(true);
    expect(result.purchasable).toBe(false);
  });

  it('returns closed window when timezone is invalid', () => {
    const opens = new Date(Date.now() + 2 * 3600000);
    const closes = new Date(Date.now() + 20 * 3600000);
    const result = resolveUpcomingPurchaseContext({
      experienceType: UpcomingExperienceType.VENUE_SEATING,
      price: null,
      clientEnabled: true,
      templateScheduleMode: null,
      reservationOpensAt: opens,
      reservationClosesAt: closes,
      reservationEventDate: closes,
      reservationTimezone: 'Not/A_Timezone',
    });
    expect(result.purchaseMode).toBe('venue_seating');
    expect(result.salesOpen).toBe(false);
    expect(result.purchasable).toBe(false);
  });

  it('classes without active sessions are not purchasable', () => {
    expect(
      resolveUpcomingPurchaseContext({
        experienceType: UpcomingExperienceType.CLASSES,
        price: 50,
        clientEnabled: false,
        templateScheduleMode: null,
        reservationOpensAt: null,
        reservationClosesAt: null,
        reservationEventDate: null,
        hasActiveSessions: false,
      }),
    ).toEqual({
      purchaseMode: 'classes',
      salesOpen: false,
      purchasable: false,
      ticketMode: 'SINGLE',
      packages: [],
    });
  });

  it('venue_seating not purchasable when sales window ended', () => {
    const opens = new Date(Date.now() - 7 * 86400000);
    const closes = new Date(Date.now() - 2 * 86400000);
    const result = resolveUpcomingPurchaseContext({
      experienceType: UpcomingExperienceType.VENUE_SEATING,
      price: null,
      clientEnabled: true,
      templateScheduleMode: null,
      reservationOpensAt: opens,
      reservationClosesAt: closes,
      reservationEventDate: closes,
      reservationTimezone: 'America/New_York',
    });
    expect(result.purchaseMode).toBe('venue_seating');
    expect(result.salesOpen).toBe(false);
    expect(result.purchasable).toBe(false);
  });

  it('date-only rescue returns null path when opensAt or closesAt missing', () => {
    const closes = new Date(Date.now() + 86400000);
    const result = resolveUpcomingPurchaseContext({
      experienceType: UpcomingExperienceType.VENUE_SEATING,
      price: null,
      clientEnabled: true,
      templateScheduleMode: null,
      reservationOpensAt: null,
      reservationClosesAt: closes,
      reservationEventDate: closes,
      reservationTimezone: 'America/New_York',
    });
    expect(result.purchaseMode).toBe('venue_seating');
    expect(result.salesOpen).toBe(false);
    expect(result.purchasable).toBe(false);
  });

  it('rescues ended window when calendar date is still inside opens/closes day range', () => {
    const opens = new Date(Date.now() - 6 * 3600000);
    const closes = new Date(Date.now() - 2 * 3600000);
    const result = resolveUpcomingPurchaseContext({
      experienceType: null,
      price: 25,
      clientEnabled: false,
      templateScheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
      reservationOpensAt: opens,
      reservationClosesAt: closes,
      reservationEventDate: closes,
      reservationTimezone: 'America/New_York',
      ticketsRemaining: 2,
    });
    expect(result.purchaseMode).toBe('fixed_ticket');
    expect(result.salesOpen).toBe(true);
    expect(result.purchasable).toBe(true);
  });

  it('fixed_ticket treats null ticketsRemaining as unlimited', () => {
    const opens = new Date(Date.now() - 86400000);
    const closes = new Date(Date.now() + 86400000);
    const result = resolveUpcomingPurchaseContext({
      experienceType: null,
      price: 25,
      clientEnabled: false,
      templateScheduleMode: ReservationEventScheduleMode.FIXED_EVENT,
      reservationOpensAt: opens,
      reservationClosesAt: closes,
      reservationEventDate: closes,
      ticketsRemaining: undefined,
    });
    expect(result.purchaseMode).toBe('fixed_ticket');
    expect(result.purchasable).toBe(result.salesOpen);
  });
});
