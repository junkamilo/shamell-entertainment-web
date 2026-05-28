export type ParsePriceResult =
  | { ok: true; value: number | null }
  | { ok: false; value: null };

export function parsePriceInput(priceInput: string): ParsePriceResult {
  const t = priceInput.trim();
  if (!t) return { ok: false, value: null };
  const n = Number(t.replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 0) return { ok: false, value: null };
  return { ok: true, value: Math.round(n * 100) / 100 };
}

export function formatPriceEn(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
}
