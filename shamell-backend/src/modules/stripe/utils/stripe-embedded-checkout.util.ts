/** Skip Stripe Link auth (avoids hCaptcha issues on mobile embedded checkout). */
export const STRIPE_EMBEDDED_CHECKOUT_WALLET_OPTIONS = {
  link: { display: 'never' as const },
};

/** Card only — avoids Amazon Pay / Cash App popups and mis-taps on mobile. */
const STRIPE_EMBEDDED_CHECKOUT_PAYMENT_METHOD_TYPES: 'card'[] = ['card'];

/**
 * Embedded Checkout light theme (Elements `appearance` API is not available client-side).
 * Mirrors shamell-frontend/src/lib/stripe/embeddedCheckoutBranding.ts
 */
export const STRIPE_EMBEDDED_CHECKOUT_APPEARANCE = {
  theme: 'stripe' as const,
  variables: {
    colorBackground: '#ffffff',
    colorText: '#1a1a1a',
    colorPrimary: '#d4af37',
    colorDanger: '#df1b41',
    fontFamily: 'system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '8px',
  },
};

export const STRIPE_EMBEDDED_CHECKOUT_BRANDING = {
  background_color:
    STRIPE_EMBEDDED_CHECKOUT_APPEARANCE.variables.colorBackground,
  button_color: STRIPE_EMBEDDED_CHECKOUT_APPEARANCE.variables.colorPrimary,
  border_style: 'rounded' as const,
  font_family: 'open_sans' as const,
};

/** Shared defaults for all Shamell embedded Checkout Sessions. */
export const STRIPE_EMBEDDED_CHECKOUT_BASE = {
  ui_mode: 'embedded_page' as const,
  locale: 'en' as const,
  payment_method_types: STRIPE_EMBEDDED_CHECKOUT_PAYMENT_METHOD_TYPES,
  wallet_options: STRIPE_EMBEDDED_CHECKOUT_WALLET_OPTIONS,
  branding_settings: STRIPE_EMBEDDED_CHECKOUT_BRANDING,
};
