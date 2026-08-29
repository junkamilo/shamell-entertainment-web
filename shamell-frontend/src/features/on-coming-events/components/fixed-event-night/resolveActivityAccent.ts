/** Flyer-style column tints when admin leaves accentColor empty. */
export const ACTIVITY_ACCENT_FALLBACKS = [
  "#0d3d32", // emerald
  "#1a2a6c", // royal blue
  "#3b1a5c", // purple
] as const;

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Resolves the public column accent for an activity.
 * Uses admin hex when valid; otherwise cycles emerald / blue / purple by index.
 */
export function resolveActivityAccent(
  accentColor: string | null | undefined,
  index: number,
): string {
  const trimmed = accentColor?.trim() ?? "";
  if (HEX_RE.test(trimmed)) {
    return trimmed.length === 4
      ? `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`
      : trimmed;
  }
  const safeIndex =
    ((index % ACTIVITY_ACCENT_FALLBACKS.length) +
      ACTIVITY_ACCENT_FALLBACKS.length) %
    ACTIVITY_ACCENT_FALLBACKS.length;
  return ACTIVITY_ACCENT_FALLBACKS[safeIndex];
}
