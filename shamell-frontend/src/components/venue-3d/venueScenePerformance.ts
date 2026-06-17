import type { VenueSceneLayoutBucket } from "./venueSceneConstants";

export type VenuePerfProfile = "high" | "mobile";

export function resolveVenuePerfProfile(opts: {
  bucket: VenueSceneLayoutBucket;
  isPhone: boolean;
  isTablet: boolean;
  isCoarsePointer: boolean;
}): VenuePerfProfile {
  if (opts.bucket === "laptop" || opts.bucket === "tv") return "high";
  if (
    opts.bucket === "phone" ||
    opts.bucket === "tablet" ||
    opts.isPhone ||
    opts.isTablet ||
    opts.isCoarsePointer
  ) {
    return "mobile";
  }
  return "high";
}

export function dprForPerfProfile(
  profile: VenuePerfProfile,
  useHighDpr: boolean,
): [number, number] {
  if (useHighDpr) return [1, 2];
  if (profile === "mobile") return [1, 1];
  return [1, 1.5];
}

export function shouldShowItemLabels(profile: VenuePerfProfile): boolean {
  return profile === "high";
}
