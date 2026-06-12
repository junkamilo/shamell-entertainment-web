import {
  signConfirmationShareToken,
  verifyConfirmationShareToken,
} from './venue-reservation-confirmation-share.util';

describe('venue-reservation-confirmation-share.util', () => {
  const secret = 'test-secret';

  it('signs and verifies a confirmation download token', () => {
    const token = signConfirmationShareToken(
      'res-1',
      '2026-06-12T19:01:33.682Z',
      secret,
    );
    expect(verifyConfirmationShareToken(token, secret)).toEqual({
      reservationId: 'res-1',
      paidAtIso: '2026-06-12T19:01:33.682Z',
    });
  });

  it('rejects tampered tokens', () => {
    const token = signConfirmationShareToken(
      'res-1',
      '2026-06-12T19:01:33.682Z',
      secret,
    );
    expect(verifyConfirmationShareToken(`${token}x`, secret)).toBeNull();
    expect(verifyConfirmationShareToken(token, 'other-secret')).toBeNull();
  });
});
