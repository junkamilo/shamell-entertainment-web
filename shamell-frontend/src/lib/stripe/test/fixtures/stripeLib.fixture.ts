import {
  FIXTURE_STRIPE_BACKGROUND,
  FIXTURE_STRIPE_PRIMARY,
  FIXTURE_STRIPE_PUBLISHABLE_KEY,
} from "./uuids.fixture";

export function makeStripePublishableKey(
  key = FIXTURE_STRIPE_PUBLISHABLE_KEY,
) {
  return key;
}

export function makeExpectedEmbeddedCheckoutBranding() {
  return {
    background_color: FIXTURE_STRIPE_BACKGROUND,
    button_color: FIXTURE_STRIPE_PRIMARY,
    border_style: "rounded" as const,
    font_family: "open_sans" as const,
  };
}

export function makeExpectedEmbeddedCheckoutAppearance() {
  return {
    theme: "stripe" as const,
    variables: {
      colorBackground: FIXTURE_STRIPE_BACKGROUND,
      colorText: "#1a1a1a",
      colorPrimary: FIXTURE_STRIPE_PRIMARY,
      colorDanger: "#df1b41",
      fontFamily: "system-ui, sans-serif",
      spacingUnit: "4px",
      borderRadius: "8px",
    },
  };
}
