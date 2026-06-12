import {
  eventDateForReservations,
  resolveReservationWindow,
} from './reservation-sales-window.util';

describe('reservation-sales-window.util', () => {
  it('uses reservationEventDate for seat reservations when sales open is separate', () => {
    const salesOpen = new Date('2026-06-12T04:00:00.000Z');
    const salesClose = new Date('2026-08-16T03:59:59.999Z');
    const eventNight = new Date('2026-08-15T22:00:00.000Z');

    const window = resolveReservationWindow({
      reservationOpensAt: salesOpen,
      reservationClosesAt: salesClose,
      reservationEventDate: eventNight,
    });

    expect(window.opensAt).toEqual(salesOpen);
    expect(window.closesAt).toEqual(salesClose);
    expect(window.eventDate).toEqual(eventNight);
    expect(eventDateForReservations(window)).toEqual(eventNight);
    expect(eventDateForReservations(window)?.getTime()).not.toBe(
      salesOpen.getTime(),
    );
  });

  it('falls back to sales open when event date is missing', () => {
    const salesOpen = new Date('2026-06-12T04:00:00.000Z');
    const window = resolveReservationWindow({
      reservationOpensAt: salesOpen,
      reservationClosesAt: new Date('2026-08-16T03:59:59.999Z'),
      reservationEventDate: null,
    });

    expect(eventDateForReservations(window)).toEqual(salesOpen);
  });
});
