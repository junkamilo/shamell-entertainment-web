/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import {
  makeExpectedEmbeddedCheckoutAppearance,
  makeExpectedEmbeddedCheckoutBranding,
  makeStripePublishableKey,
} from "./fixtures/stripeLib.fixture";
import { FIXTURE_STRIPE_PUBLISHABLE_KEY } from "./fixtures/uuids.fixture";
import { createMockStripeClientState } from "./helpers/mockStripeLib";
import {
  STRIPE_EMBEDDED_CHECKOUT_APPEARANCE,
  STRIPE_EMBEDDED_CHECKOUT_BRANDING,
} from "../embeddedCheckoutBranding";

describe("stripe lib test environment", () => {
  it("exposes usable fixtures and mocks", () => {
    expect(makeStripePublishableKey()).toBe(FIXTURE_STRIPE_PUBLISHABLE_KEY);
    expect(createMockStripeClientState().publishableKey).toBe(
      FIXTURE_STRIPE_PUBLISHABLE_KEY,
    );
    expect(makeExpectedEmbeddedCheckoutBranding().button_color).toBe(
      STRIPE_EMBEDDED_CHECKOUT_BRANDING.button_color,
    );
  });

  it("keeps branding constants wired for smoke", () => {
    expect(STRIPE_EMBEDDED_CHECKOUT_APPEARANCE).toEqual(
      makeExpectedEmbeddedCheckoutAppearance(),
    );
    expect(STRIPE_EMBEDDED_CHECKOUT_BRANDING).toEqual(
      makeExpectedEmbeddedCheckoutBranding(),
    );
  });
});
