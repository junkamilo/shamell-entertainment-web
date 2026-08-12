import { peticionesSqlFragments } from './peticiones-sql.util';

describe('peticiones-sql.util', () => {
  it('exports expected fragment keys', () => {
    const fragments = peticionesSqlFragments();
    expect(Object.keys(fragments).sort()).toEqual([
      'isConciergeContact',
      'isNonPrivateClassBooking',
      'isOrphanContact',
      'isPrivateClassBooking',
      'isShadowedBookingInquiryContact',
    ]);
  });

  it('isNonPrivateClassBooking uses IS DISTINCT FROM for null-safe kind filter', () => {
    const { isNonPrivateClassBooking, isPrivateClassBooking } =
      peticionesSqlFragments();
    expect(isNonPrivateClassBooking.strings.join('')).toContain(
      'IS DISTINCT FROM',
    );
    expect(isPrivateClassBooking.strings.join('')).toContain('private_class');
  });
  it('each fragment is a Prisma.Sql-like object', () => {
    const fragments = peticionesSqlFragments();
    for (const value of Object.values(fragments)) {
      expect(Array.isArray(value.strings)).toBe(true);
      expect(Array.isArray(value.values)).toBe(true);
    }
  });
});
