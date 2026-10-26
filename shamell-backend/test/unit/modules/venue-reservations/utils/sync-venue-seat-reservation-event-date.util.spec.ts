import { syncVenueSeatReservationEventDates } from '@app/modules/venue-reservations/utils/sync-venue-seat-reservation-event-date.util';

describe('syncVenueSeatReservationEventDates', () => {
  it('updates all reservations for the upcoming event', async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 2 });
    const prisma = { venueSeatReservation: { updateMany } };
    const next = new Date('2026-09-01T00:00:00.000Z');

    await syncVenueSeatReservationEventDates(prisma as never, 'evt-1', next);

    expect(updateMany).toHaveBeenCalledWith({
      where: { upcomingEventId: 'evt-1' },
      data: { eventDate: next },
    });
  });
});
