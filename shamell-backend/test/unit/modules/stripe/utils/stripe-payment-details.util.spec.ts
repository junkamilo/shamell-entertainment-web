import { formatPaymentMethodLabel } from '@app/modules/stripe/utils/stripe-payment-details.util';

describe('formatPaymentMethodLabel', () => {
  it('labels cash payments', () => {
    expect(
      formatPaymentMethodLabel({
        paymentMethodType: 'cash',
        paymentMethodBrand: null,
        paymentMethodLast4: null,
      }),
    ).toBe('Cash');
  });
});
