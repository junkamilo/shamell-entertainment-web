/**
 * Embedded Checkout does NOT support the Elements `appearance` object in
 * `EmbeddedCheckoutProvider.options` (only clientSecret / fetchClientSecret).
 * Visual theme is applied server-side via Checkout Session `branding_settings`.
 */
export const STRIPE_EMBEDDED_CHECKOUT_APPEARANCE = {
  theme: "stripe" as const,
  variables: {
    colorBackground: "#ffffff",
    colorText: "#1a1a1a",
    colorPrimary: "#d4af37",
    colorDanger: "#df1b41",
    fontFamily: "system-ui, sans-serif",
    spacingUnit: "4px",
    borderRadius: "8px",
  },
} as const;

export const STRIPE_EMBEDDED_CHECKOUT_BRANDING = {
  background_color: STRIPE_EMBEDDED_CHECKOUT_APPEARANCE.variables.colorBackground,
  button_color: STRIPE_EMBEDDED_CHECKOUT_APPEARANCE.variables.colorPrimary,
  border_style: "rounded" as const,
  font_family: "open_sans" as const,
} as const;
