import { vi } from "vitest";
import { makeStripePublishableKey } from "../fixtures/stripeLib.fixture";
import {
  FIXTURE_STRIPE_BACKGROUND,
  FIXTURE_STRIPE_PRIMARY,
} from "../fixtures/uuids.fixture";

export function createMockStripeClientState(
  overrides: Record<string, unknown> = {},
) {
  return {
    publishableKey: makeStripePublishableKey(),
    stripe: { id: "stripe-fixture" },
    ...overrides,
  };
}

export function createMockEmbeddedCheckoutBrandingState(
  overrides: Record<string, unknown> = {},
) {
  return {
    background_color: FIXTURE_STRIPE_BACKGROUND,
    button_color: FIXTURE_STRIPE_PRIMARY,
    border_style: "rounded",
    font_family: "open_sans",
    ...overrides,
  };
}

export function createLoadStripeMock(stripe: unknown = { id: "stripe-mock" }) {
  const loadStripe = Object.assign(
    vi.fn(() => Promise.resolve(stripe)),
    {
      setLoadParameters: vi.fn(),
    },
  );
  return loadStripe;
}
