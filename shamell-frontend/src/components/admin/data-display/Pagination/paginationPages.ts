const WINDOW_SIZE = 5;

/** Normalize totalPages to a finite integer ≥ 0 (NaN / ∞ / negative → 0). */
export function normalizeTotalPages(totalPages: number): number {
  if (!Number.isFinite(totalPages)) return 0;
  return Math.max(0, Math.floor(totalPages));
}

/**
 * Visible page numbers around `page` (up to WINDOW_SIZE), without allocating `1..totalPages`.
 * Matches prior slice window: start at max(page - 2, 1), take up to 5 pages.
 */
export function visiblePageNumbers(page: number, totalPages: number): number[] {
  const safeTotal = normalizeTotalPages(totalPages);
  if (safeTotal === 0) return [];

  const safePage = Number.isFinite(page)
    ? Math.min(Math.max(1, Math.floor(page)), safeTotal)
    : 1;

  const start = Math.max(1, safePage - 2);
  const end = Math.min(safeTotal, start + WINDOW_SIZE - 1);

  const pages: number[] = [];
  for (let p = start; p <= end; p += 1) {
    pages.push(p);
  }
  return pages;
}
