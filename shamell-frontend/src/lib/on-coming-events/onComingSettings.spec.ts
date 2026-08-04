import { describe, expect, it } from "vitest";
import { makeOnComingPromo } from "./test/fixtures/onComingEventsLib.fixture";
import {
  defaultOnComingSettings,
  normalizeOnComingSettings,
} from "./onComingSettings";

describe("defaultOnComingSettings", () => {
  it("starts unpublished with New York timezone", () => {
    expect(defaultOnComingSettings).toEqual({
      clientEnabled: false,
      promoTitle: null,
      promoDescription: null,
      promoImageUrl: null,
      reservationEventDate: null,
      reservationOpensAt: null,
      reservationClosesAt: null,
      reservationEventLabel: null,
      reservationTimezone: "America/New_York",
      updatedAt: null,
    });
  });
});

describe("normalizeOnComingSettings", () => {
  it("returns defaults for non-objects", () => {
    expect(normalizeOnComingSettings(null)).toEqual(defaultOnComingSettings);
    expect(normalizeOnComingSettings("x")).toEqual(defaultOnComingSettings);
    expect(normalizeOnComingSettings(undefined)).toEqual(defaultOnComingSettings);
  });

  it("normalizes a full promo payload", () => {
    expect(normalizeOnComingSettings(makeOnComingPromo())).toEqual(
      makeOnComingPromo(),
    );
  });

  it("coerces missing fields and boolean clientEnabled", () => {
    expect(
      normalizeOnComingSettings({
        clientEnabled: 1,
        promoTitle: "T",
      }),
    ).toEqual({
      ...defaultOnComingSettings,
      clientEnabled: true,
      promoTitle: "T",
    });
  });

  it("falls back timezone when omitted", () => {
    expect(
      normalizeOnComingSettings({
        clientEnabled: false,
      }).reservationTimezone,
    ).toBe("America/New_York");
  });
});
