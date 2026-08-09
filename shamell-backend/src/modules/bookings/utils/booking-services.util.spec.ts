import {
  resolveBookingServiceIds,
  syncBookingServices,
} from './booking-services.util';

describe('booking-services.util', () => {
  describe('resolveBookingServiceIds', () => {
    it('uses bookingDetails.serviceIds with primary first', () => {
      const primary = '11111111-1111-4111-8111-111111111111';
      const other = '22222222-2222-4222-8222-222222222222';
      const ids = resolveBookingServiceIds(primary, {
        serviceIds: [other, primary],
      });
      expect(ids[0]).toBe(primary);
      expect(ids).toContain(other);
    });

    it('falls back to primary when details missing', () => {
      const only = '11111111-1111-4111-8111-111111111111';
      expect(resolveBookingServiceIds(only, undefined)).toEqual([only]);
    });
  });

  describe('syncBookingServices', () => {
    it('replaces junction rows for a booking', async () => {
      const deleteMany = jest.fn().mockResolvedValue({ count: 0 });
      const createMany = jest.fn().mockResolvedValue({ count: 2 });
      const tx = { bookingService: { deleteMany, createMany } };

      await syncBookingServices(tx as never, 'booking-1', ['a', 'b']);

      expect(deleteMany).toHaveBeenCalledWith({
        where: { bookingId: 'booking-1' },
      });
      expect(createMany).toHaveBeenCalledWith({
        data: [
          { bookingId: 'booking-1', serviceId: 'a', sortOrder: 0 },
          { bookingId: 'booking-1', serviceId: 'b', sortOrder: 1 },
        ],
        skipDuplicates: true,
      });
    });
  });
});
