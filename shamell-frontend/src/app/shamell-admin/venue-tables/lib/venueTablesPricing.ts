import { formatPriceEn } from "./parseVenueTablePrice";

export function comboSummaryLabel(
  tableName: string,
  includedChairs: number,
  bundlePrice: number | null,
): string {
  const price = bundlePrice != null ? formatPriceEn(bundlePrice) : "—";
  return `Combo: ${price} — ${tableName} + ${includedChairs} chair${includedChairs === 1 ? "" : "s"} included`;
}
