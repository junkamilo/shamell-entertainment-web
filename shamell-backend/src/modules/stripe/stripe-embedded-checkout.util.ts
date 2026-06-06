/** Skip Stripe Link auth (avoids hCaptcha issues on mobile embedded checkout). */
export const STRIPE_EMBEDDED_CHECKOUT_WALLET_OPTIONS = {
  link: { display: 'never' as const },
};
