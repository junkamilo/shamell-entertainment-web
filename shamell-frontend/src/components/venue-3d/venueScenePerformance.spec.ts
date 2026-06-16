import {
  dprForPerfProfile,
  resolveVenuePerfProfile,
  shouldShowItemLabels,
} from "./venueScenePerformance";

describe("venueScenePerformance", () => {
  describe("resolveVenuePerfProfile", () => {
    it("uses high profile on laptop and tv", () => {
      expect(
        resolveVenuePerfProfile({
          bucket: "laptop",
          isPhone: false,
          isTablet: false,
          isCoarsePointer: false,
        }),
      ).toBe("high");
      expect(
        resolveVenuePerfProfile({
          bucket: "tv",
          isPhone: false,
          isTablet: false,
          isCoarsePointer: false,
        }),
      ).toBe("high");
    });

    it("uses mobile profile on phone, tablet, and coarse pointer", () => {
      expect(
        resolveVenuePerfProfile({
          bucket: "phone",
          isPhone: true,
          isTablet: false,
          isCoarsePointer: true,
        }),
      ).toBe("mobile");
      expect(
        resolveVenuePerfProfile({
          bucket: "tablet",
          isPhone: false,
          isTablet: true,
          isCoarsePointer: false,
        }),
      ).toBe("mobile");
    });
  });

  describe("dprForPerfProfile", () => {
    it("caps mobile DPR at 1", () => {
      expect(dprForPerfProfile("mobile", false)).toEqual([1, 1]);
    });

    it("allows higher DPR on desktop", () => {
      expect(dprForPerfProfile("high", false)).toEqual([1, 1.5]);
      expect(dprForPerfProfile("high", true)).toEqual([1, 2]);
    });
  });

  describe("shouldShowItemLabels", () => {
    it("always shows labels on high profile", () => {
      expect(shouldShowItemLabels("high", false)).toBe(true);
      expect(shouldShowItemLabels("high", true)).toBe(true);
    });

    it("shows labels on mobile only when selected", () => {
      expect(shouldShowItemLabels("mobile", false)).toBe(false);
      expect(shouldShowItemLabels("mobile", true)).toBe(true);
    });
  });
});
