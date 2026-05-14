/** Amount only (no currency symbol) — matches EventCatalogCard numbering. */
export function formatCatalogPriceAmount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatCatalogPriceWithSuffix(
  price: number | null | undefined,
  currencySuffix = "USD",
): string | null {
  if (price == null || Number.isNaN(Number(price))) return null;
  return `${formatCatalogPriceAmount(Number(price))} ${currencySuffix}`;
}
