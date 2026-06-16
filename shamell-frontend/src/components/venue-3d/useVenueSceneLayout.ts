"use client";

import { useMemo } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  type VenueSceneLayoutBucket,
  VIEWPORT_HEIGHT_BY_BUCKET,
} from "./venueSceneConstants";
import { dprForPerfProfile, resolveVenuePerfProfile } from "./venueScenePerformance";

export type VenueSceneLayoutVariant = "public" | "admin";

export function useVenueSceneLayout(variant: VenueSceneLayoutVariant = "public") {
  const isPhone = useMediaQuery("(max-width: 639px)");
  const isTablet = useMediaQuery("(min-width: 640px) and (max-width: 1023px)");
  const isLaptop = useMediaQuery("(min-width: 1024px) and (max-width: 1919px)");
  const isTv = useMediaQuery("(min-width: 1920px)");
  const isCoarsePointer = useMediaQuery("(pointer: coarse)");
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const useHighDpr = isTv && !prefersReducedMotion;

  const bucket = useMemo((): VenueSceneLayoutBucket => {
    if (isTv) return "tv";
    if (isLaptop) return "laptop";
    if (isTablet) return "tablet";
    return "phone";
  }, [isTv, isLaptop, isTablet]);

  const heights = VIEWPORT_HEIGHT_BY_BUCKET[bucket];

  const perfProfile = useMemo(
    () =>
      resolveVenuePerfProfile({
        bucket,
        isPhone,
        isTablet,
        isCoarsePointer,
      }),
    [bucket, isCoarsePointer, isPhone, isTablet],
  );

  return useMemo(
    () => ({
      bucket,
      perfProfile,
      viewportHeight: variant === "public" ? heights.public : heights.admin,
      viewportMinHeight: heights.minHeight,
      isCoarsePointer,
      isPhone,
      isTablet,
      isLaptop,
      isTv,
      dpr: dprForPerfProfile(perfProfile, useHighDpr),
      /** Chrome offset for public page header + site header. */
      chromeCss: variant === "public" ? "14rem" : "10rem",
    }),
    [
      bucket,
      heights.admin,
      heights.minHeight,
      heights.public,
      isCoarsePointer,
      isLaptop,
      isPhone,
      isTablet,
      isTv,
      perfProfile,
      useHighDpr,
      variant,
    ],
  );
}
