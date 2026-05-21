export function parseOptionalPrice(
  raw: string,
  mode: "create" | "edit",
): { ok: true; value: number | null | undefined } | { ok: false; message: string } {
  const t = raw.trim();
  if (!t) return { ok: true, value: mode === "edit" ? null : undefined };
  const n = Number(t.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return { ok: false, message: "Invalid price." };
  if (n > 99_999_999.99) return { ok: false, message: "Price is too high." };
  return { ok: true, value: Math.round(n * 100) / 100 };
}

export function formatPriceEn(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatPriceInput(value: number): string {
  return String(value);
}
