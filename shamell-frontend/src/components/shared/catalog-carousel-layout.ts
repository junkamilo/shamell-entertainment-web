export type CarouselLayout = {
  visibleCount: 1 | 2 | 3;
  gapPx: number;
  /** CSS width/flex-basis for each slide. */
  slideBasis: string;
  /** Mobile/tablet horizontal swipe rail (one card per view). */
  useSwipeRail: boolean;
};

const GAP_LG = 32;
const GAP_MOBILE = 24;

function desktopBasis(visibleCount: number, gapPx: number): string {
  if (visibleCount <= 0) return "100%";
  return `calc((100% - ${(visibleCount - 1) * gapPx}px) / ${visibleCount})`;
}

export function resolveCarouselLayout(
  isLgUp: boolean,
  isXlUp: boolean,
  maxVisible = 3,
): CarouselLayout {
  if (!isLgUp) {
    return {
      visibleCount: 1,
      gapPx: GAP_MOBILE,
      slideBasis: "min(88vw, 26rem)",
      useSwipeRail: true,
    };
  }

  const visibleCount: 1 | 2 | 3 =
    isXlUp && maxVisible >= 3 ? 3 : maxVisible >= 2 ? 2 : 1;

  return {
    visibleCount,
    gapPx: GAP_LG,
    slideBasis: desktopBasis(visibleCount, GAP_LG),
    useSwipeRail: false,
  };
}
