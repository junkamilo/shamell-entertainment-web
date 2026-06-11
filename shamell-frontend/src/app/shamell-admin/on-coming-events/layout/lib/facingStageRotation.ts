import { layoutToWorld } from "@/components/venue-3d/layoutCoords3d";

/** Degrees for a banquet chair (front = +Z) to face the stage at world (stageX, stageZ). */
export function facingStageRotationDegrees(
  layoutX: number,
  layoutY: number,
  viewBoxWidth: number,
  viewBoxHeight: number,
  stageWorldX: number,
  stageWorldZ: number,
): number {
  const { x: worldX, z: worldZ } = layoutToWorld(
    layoutX,
    layoutY,
    viewBoxWidth,
    viewBoxHeight,
  );
  const dx = stageWorldX - worldX;
  const dz = stageWorldZ - worldZ;
  if (dx * dx + dz * dz < 1e-8) return 0;

  let degrees = (Math.atan2(dx, dz) * 180) / Math.PI;
  if (degrees > 180) degrees -= 360;
  if (degrees < -180) degrees += 360;
  return degrees;
}
