import type { FloorLayoutPalette } from "@/components/floor-layout";

export type LegendPlacedSummary = {
  large: number;
  medium: number;
  small: number;
  chairs: number;
};

export type LegendCounts = LegendPlacedSummary;

/** Pure legend counts from palette or placed summary. */
export function legendCountsFromPalette(
  palette?: FloorLayoutPalette | null,
  placedSummary?: LegendPlacedSummary,
): LegendCounts {
  return {
    large: palette?.tablesBySize.LARGE ?? placedSummary?.large ?? 0,
    medium: palette?.tablesBySize.MEDIUM ?? placedSummary?.medium ?? 0,
    small: palette?.tablesBySize.SMALL ?? placedSummary?.small ?? 0,
    chairs: palette?.standaloneChairsAvailable ?? placedSummary?.chairs ?? 0,
  };
}
