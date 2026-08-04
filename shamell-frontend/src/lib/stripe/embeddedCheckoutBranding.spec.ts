import { describe, expect, it } from "vitest";
import {
  makeExpectedEmbeddedCheckoutAppearance,
  makeExpectedEmbeddedCheckoutBranding,
} from "./test/fixtures/stripeLib.fixture";
import {
  STRIPE_EMBEDDED_CHECKOUT_APPEARANCE,
  STRIPE_EMBEDDED_CHECKOUT_BRANDING,
} from "./embeddedCheckoutBranding";

describe("embeddedCheckoutBranding", () => {
  it("exposes Elements-style appearance tokens", () => {
    expect(STRIPE_EMBEDDED_CHECKOUT_APPEARANCE).toEqual(
      makeExpectedEmbeddedCheckoutAppearance(),
    );
    expect(STRIPE_EMBEDDED_CHECKOUT_APPEARANCE.theme).toBe("stripe");
    expect(STRIPE_EMBEDDED_CHECKOUT_APPEARANCE.variables.colorPrimary).toBe(
      "#d4af37",
    );
  });

  it("maps appearance variables into Checkout Session branding_settings", () => {
    expect(STRIPE_EMBEDDED_CHECKOUT_BRANDING).toEqual(
      makeExpectedEmbeddedCheckoutBranding(),
    );
    expect(STRIPE_EMBEDDED_CHECKOUT_BRANDING.background_color).toBe(
      STRIPE_EMBEDDED_CHECKOUT_APPEARANCE.variables.colorBackground,
    );
    expect(STRIPE_EMBEDDED_CHECKOUT_BRANDING.button_color).toBe(
      STRIPE_EMBEDDED_CHECKOUT_APPEARANCE.variables.colorPrimary,
    );
    expect(STRIPE_EMBEDDED_CHECKOUT_BRANDING.border_style).toBe("rounded");
    expect(STRIPE_EMBEDDED_CHECKOUT_BRANDING.font_family).toBe("open_sans");
  });
});
