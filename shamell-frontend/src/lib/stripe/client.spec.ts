import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FIXTURE_STRIPE_PUBLISHABLE_KEY } from "./test/fixtures/uuids.fixture";

const { loadStripeMock } = vi.hoisted(() => {
  const loadStripeMock = Object.assign(
    vi.fn(() => Promise.resolve({ id: "stripe-mock" })),
    { setLoadParameters: vi.fn() },
  );
  return { loadStripeMock };
});

vi.mock("@stripe/stripe-js/pure", () => ({
  loadStripe: loadStripeMock,
}));

describe("getStripePromise", () => {
  const originalKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  beforeEach(() => {
    vi.resetModules();
    loadStripeMock.mockClear();
    loadStripeMock.setLoadParameters.mockClear();
    loadStripeMock.mockResolvedValue({ id: "stripe-mock" });
  });

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    } else {
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = originalKey;
    }
  });

  it("resolves null when publishable key is missing", async () => {
    delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    const { getStripePromise } = await import("./client");
    await expect(getStripePromise()).resolves.toBeNull();
    expect(loadStripeMock).not.toHaveBeenCalled();
  });

  it("loads Stripe once with advancedFraudSignals disabled", async () => {
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY =
      FIXTURE_STRIPE_PUBLISHABLE_KEY;
    const { getStripePromise } = await import("./client");

    const first = getStripePromise();
    const second = getStripePromise();
    expect(first).toBe(second);

    await expect(first).resolves.toEqual({ id: "stripe-mock" });
    expect(loadStripeMock.setLoadParameters).toHaveBeenCalledWith({
      advancedFraudSignals: false,
    });
    expect(loadStripeMock).toHaveBeenCalledTimes(1);
    expect(loadStripeMock).toHaveBeenCalledWith(FIXTURE_STRIPE_PUBLISHABLE_KEY);
  });
});
