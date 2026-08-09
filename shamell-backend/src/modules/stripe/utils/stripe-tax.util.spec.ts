import { BadRequestException } from '@nestjs/common';
import { assertCheckoutPaidAmounts } from './stripe-tax.util';

describe('assertCheckoutPaidAmounts', () => {
  it('accepts matching subtotal and total with tax', () => {
    expect(() =>
      assertCheckoutPaidAmounts(
        {
          id: 'cs_1',
          amount_subtotal: 10000,
          amount_total: 10800,
          currency: 'usd',
        },
        { expectedSubtotalCents: 10000, expectedCurrency: 'usd' },
      ),
    ).not.toThrow();
  });

  it('rejects subtotal mismatch', () => {
    expect(() =>
      assertCheckoutPaidAmounts(
        {
          id: 'cs_1',
          amount_subtotal: 9000,
          amount_total: 9000,
          currency: 'usd',
        },
        { expectedSubtotalCents: 10000, expectedCurrency: 'usd' },
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects currency mismatch', () => {
    expect(() =>
      assertCheckoutPaidAmounts(
        {
          id: 'cs_1',
          amount_subtotal: 10000,
          amount_total: 10000,
          currency: 'eur',
        },
        { expectedSubtotalCents: 10000, expectedCurrency: 'usd' },
      ),
    ).toThrow(/Currency mismatch/);
  });

  it('falls back to amount_total when subtotal missing', () => {
    expect(() =>
      assertCheckoutPaidAmounts(
        {
          id: 'cs_1',
          amount_total: 10000,
          currency: 'usd',
        },
        { expectedSubtotalCents: 10000, expectedCurrency: 'usd' },
      ),
    ).not.toThrow();

    expect(() =>
      assertCheckoutPaidAmounts(
        {
          id: 'cs_1',
          amount_total: 9999,
          currency: 'usd',
        },
        { expectedSubtotalCents: 10000, expectedCurrency: 'usd' },
      ),
    ).toThrow(/Amount mismatch/);
  });
});
