import type { VenueSceneLayoutBucket } from "./venueSceneConstants";

export type VenuePerfProfile = "high" | "mobile";

export function resolveVenuePerfProfile(opts: {
  bucket: VenueSceneLayoutBucket;
  isPhone: boolean;
  isTablet: boolean;
  isCoarsePointer: boolean;
}): VenuePerfProfile {
  if (opts.bucket === "laptop") return "high";
  if (opts.bucket === "tv") return "high";
  if (opts.bucket === "phone") return "mobile";
  if (opts.bucket === "tablet") return "mobile";
  /* v8 ignore start */
  if (opts.isPhone || opts.isTablet || opts.isCoarsePointer) return "mobile";
  return "high";
  /* v8 ignore stop */
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
