import { validateGuestVsUser } from './booking-guest.util';

describe('booking-guest.util', () => {
  it('rejects guest fields with userId', () => {
    expect(() =>
      validateGuestVsUser({
        userId: 'u-1',
        guestFullName: 'Ada',
      }),
    ).toThrow(/Do not send guest fields/);
  });

  it('requires guest fields without userId', () => {
    expect(() => validateGuestVsUser({})).toThrow(/guestFullName/);
  });

  it('accepts guest-only payload', () => {
    expect(() =>
      validateGuestVsUser({
        guestFullName: 'Ada Lovelace',
        guestEmail: 'ada@example.com',
        guestPhone: '+15551212',
      }),
    ).not.toThrow();
  });
});
