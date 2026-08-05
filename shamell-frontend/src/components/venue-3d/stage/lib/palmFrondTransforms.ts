export const PALM_FROND_ANGLES = [-0.9, -0.35, 0.15, 0.55, 0.95, 1.35] as const;

export type PalmFrondTransform = {
  position: [number, number, number];
  rotation: [number, number, number];
};

/** Pure frond transforms for StagePalmPlant (frozen visual math). */
export function palmFrondTransforms(
  scale: number,
  frondBaseY: number,
  angles: readonly number[] = PALM_FROND_ANGLES,
): PalmFrondTransform[] {
  return angles.map((angle, i) => ({
    position: [
      Math.sin(angle) * 0.08 * scale,
      frondBaseY + 0.25 * scale,
      Math.cos(angle) * 0.06 * scale,
    ],
    rotation: [0.25 + i * 0.04, angle, 0],
  }));
}
