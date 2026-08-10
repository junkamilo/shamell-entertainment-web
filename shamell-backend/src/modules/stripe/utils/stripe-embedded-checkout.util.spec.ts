import {
  STRIPE_EMBEDDED_CHECKOUT_APPEARANCE,
  STRIPE_EMBEDDED_CHECKOUT_BASE,
  STRIPE_EMBEDDED_CHECKOUT_BRANDING,
  STRIPE_EMBEDDED_CHECKOUT_WALLET_OPTIONS,
} from './stripe-embedded-checkout.util';

describe('stripe-embedded-checkout.util', () => {
  it('exports wallet options that hide Link', () => {
    expect(STRIPE_EMBEDDED_CHECKOUT_WALLET_OPTIONS.link.display).toBe('never');
  });

  it('exports appearance and branding colors', () => {
    expect(STRIPE_EMBEDDED_CHECKOUT_APPEARANCE.theme).toBe('stripe');
    expect(STRIPE_EMBEDDED_CHECKOUT_APPEARANCE.variables.colorPrimary).toBe(
      '#d4af37',
    );
    expect(STRIPE_EMBEDDED_CHECKOUT_BRANDING.button_color).toBe('#d4af37');
  });

  it('exports shared embedded checkout base', () => {
    expect(STRIPE_EMBEDDED_CHECKOUT_BASE.ui_mode).toBe('embedded_page');
    expect(STRIPE_EMBEDDED_CHECKOUT_BASE.payment_method_types).toEqual([
      'card',
    ]);
    expect(STRIPE_EMBEDDED_CHECKOUT_BASE.wallet_options).toBe(
      STRIPE_EMBEDDED_CHECKOUT_WALLET_OPTIONS,
    );
  });
});
