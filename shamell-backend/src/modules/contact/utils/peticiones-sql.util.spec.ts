import { peticionesSqlFragments } from './peticiones-sql.util';

describe('peticiones-sql.util', () => {
  it('exports expected fragment keys', () => {
    const fragments = peticionesSqlFragments();
    expect(Object.keys(fragments).sort()).toEqual([
      'isConciergeContact',
      'isOrphanContact',
      'isPrivateClassBooking',
      'isShadowedBookingInquiryContact',
    ]);
  });

  it('each fragment is a Prisma.Sql-like object', () => {
    const fragments = peticionesSqlFragments();
    for (const value of Object.values(fragments)) {
      expect(Array.isArray(value.strings)).toBe(true);
      expect(Array.isArray(value.values)).toBe(true);
    }
  });
});
