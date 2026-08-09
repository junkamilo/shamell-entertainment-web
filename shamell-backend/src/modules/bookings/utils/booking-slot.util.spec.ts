import {
  validateBookingTimeRange,
  bookingWindowFromEvent,
  rangesOverlap,
} from './booking-slot.util';

describe('booking-slot.util', () => {
  describe('validateBookingTimeRange', () => {
    it('allows missing times', () => {
      expect(() => validateBookingTimeRange(undefined)).not.toThrow();
      expect(() => validateBookingTimeRange({})).not.toThrow();
    });

    it('rejects partial range', () => {
      expect(() =>
        validateBookingTimeRange({ eventTimeStart: '10:00' }),
      ).toThrow(/together/);
    });

    it('rejects end before start', () => {
      expect(() =>
        validateBookingTimeRange({
          eventTimeStart: '14:00',
          eventTimeEnd: '13:00',
        }),
      ).toThrow(/after eventTimeStart/);
    });

    it('accepts valid range', () => {
      expect(() =>
        validateBookingTimeRange({
          eventTimeStart: '10:00',
          eventTimeEnd: '12:00',
        }),
      ).not.toThrow();
    });
  });

  describe('bookingWindowFromEvent', () => {
    it('reads times from bookingDetails', () => {
      const eventDate = new Date('2026-07-15T16:00:00.000Z');
      const window = bookingWindowFromEvent(
        eventDate,
        { eventTimeStart: '10:00', eventTimeEnd: '12:00' },
        'America/New_York',
      );
      expect(window.startMinutes).toBe(10 * 60);
      expect(window.endMinutes).toBe(12 * 60);
    });
  });

  describe('rangesOverlap', () => {
    it('detects overlap and gap', () => {
      expect(rangesOverlap(600, 700, 650, 750)).toBe(true);
      expect(rangesOverlap(600, 700, 701, 800)).toBe(false);
    });
  });
});
