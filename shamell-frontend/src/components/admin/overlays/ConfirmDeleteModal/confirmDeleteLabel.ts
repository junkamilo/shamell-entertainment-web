/** Normalize and shorten entity names shown in delete confirmation modals. */
export function buildConfirmDeleteLabel(
  text: string,
  maxLength = 72,
): { display: string; full: string; truncated: boolean } {
  const full = text.replace(/\s+/g, " ").trim();
  if (!full) return { display: "Untitled", full: "Untitled", truncated: false };
  if (full.length <= maxLength) return { display: full, full, truncated: false };

  const slice = full.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > Math.floor(maxLength * 0.55) ? slice.slice(0, lastSpace) : slice;
  return { display: `${cut.trim()}…`, full, truncated: true };
}

/** @deprecated Prefer buildConfirmDeleteLabel */
export const truncateDeleteConfirmLabel = buildConfirmDeleteLabel;
