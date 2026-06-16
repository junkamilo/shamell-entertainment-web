import type { VenueSceneLayoutBucket } from "./venueSceneConstants";

export type VenuePerfProfile = "high" | "mobile";

export function resolveVenuePerfProfile(opts: {
  bucket: VenueSceneLayoutBucket;
  isPhone: boolean;
  isTablet: boolean;
  isCoarsePointer: boolean;
}): VenuePerfProfile {
  if (opts.bucket === "laptop" || opts.bucket === "tv") return "high";
  if (opts.isPhone || opts.isTablet || opts.isCoarsePointer) return "mobile";
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

export function shouldShowItemLabels(profile: VenuePerfProfile, selected: boolean): boolean {
  if (profile === "high") return true;
  return selected;
}
