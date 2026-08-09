import { BookingQuotePaymentModel, BookingStatus } from '@prisma/client';
import {
  buildQuotePayUrl,
  hashQuoteToken,
  isBookingFullyPaid,
} from './booking-quote.util';

describe('booking-quote.util', () => {
  it('hashQuoteToken is stable sha256 hex', () => {
    const a = hashQuoteToken('token-1');
    const b = hashQuoteToken('token-1');
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
    expect(hashQuoteToken('token-2')).not.toBe(a);
  });

  it('isBookingFullyPaid detects balance or full confirmed', () => {
    expect(
      isBookingFullyPaid({
        status: BookingStatus.PENDING,
        depositPaidAt: null,
        balancePaidAt: new Date(),
        quoteModel: BookingQuotePaymentModel.DEPOSIT,
      }),
    ).toBe(true);
    expect(
      isBookingFullyPaid({
        status: BookingStatus.CONFIRMED,
        depositPaidAt: null,
        balancePaidAt: null,
        quoteModel: BookingQuotePaymentModel.FULL,
      }),
    ).toBe(true);
    expect(
      isBookingFullyPaid({
        status: BookingStatus.PENDING,
        depositPaidAt: new Date(),
        balancePaidAt: null,
        quoteModel: BookingQuotePaymentModel.DEPOSIT,
      }),
    ).toBe(false);
  });

  it('buildQuotePayUrl strips trailing slash', () => {
    expect(buildQuotePayUrl('https://example.com/', 'abc')).toBe(
      'https://example.com/pay/quote?token=abc',
    );
  });
});
