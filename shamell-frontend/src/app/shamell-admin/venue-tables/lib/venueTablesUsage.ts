import type { TableSize, VenueTableConfig } from "../types/venueTables.types";

export function canBulkEditTablePrices(
  sizeFilter: "ALL" | TableSize,
  tableCount: number,
): boolean {
  return sizeFilter !== "ALL" && tableCount > 0;
}

export function getBulkEditTablePricesBlockedDescription(): string {
  return "Select a size tab (Large, Medium, or Small) to edit all prices for that group.";
}

export function suggestBulkBundlePrice(items: VenueTableConfig[]): string {
  if (items.length === 0) return "";

  const prices = items.map((item) => item.bundlePrice);
  const allSame = prices.every((price) => price === prices[0]);
  if (allSame && prices[0] > 0) {
    return String(prices[0]);
  }

  const avg = prices.reduce((acc, price) => acc + price, 0) / prices.length;
  const rounded = Math.round(avg * 100) / 100;
  return rounded > 0 ? String(rounded) : "";
}
