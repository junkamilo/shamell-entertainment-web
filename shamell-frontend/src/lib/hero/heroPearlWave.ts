/**
 * Hero bottom edge: wave that touches both lower corners (y = 1 at x = 0 and x = 1)
 * so there are no black wedges. Interior undulates via sines that vanish at the edges.
 *
 * `x` ∈ [0,1] left → right. Returns Y from top of hero (0–1): visible image is y ≤ this value.
 */
export function heroWaveEdgeYNorm(x: number): number {
  const clampedX = Math.min(1, Math.max(0, x));
  const sx = Math.sin(Math.PI * clampedX);
  const sx2 = sx * sx;
  const bite =
    0.034 * sx2 +
    0.015 * sx2 * Math.sin(2 * Math.PI * clampedX) +
    0.01 * sx * Math.sin(3 * Math.PI * clampedX);
  return Math.min(1, Math.max(0.9, 1 - bite));
}

/** Upper bound of (1 − y) along the wave; used to map pearl Y in the bottom strip. */
export const HERO_WAVE_MAX_BITE = 0.042;

export function buildHeroWaveClipPathD(steps = 200): string {
  let d = "M 0 0 L 1 0";
  d += ` L 1 ${heroWaveEdgeYNorm(1).toFixed(5)}`;
  for (let s = steps - 1; s >= 0; s--) {
    const x = s / steps;
    d += ` L ${x.toFixed(5)} ${heroWaveEdgeYNorm(x).toFixed(5)}`;
  }
  d += " Z";
  return d;
}
