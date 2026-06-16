import type { VenueTableSize } from "@/components/floor-layout/layoutTypes";
import { CHAIR_SEAT } from "./chairConstants";
import { TABLE_WORLD } from "../venueSceneConstants";

/** Clearance from table edge to chair seat (world meters). */
export const CHAIR_TABLE_EDGE_GAP = 0.06;

export type ChairLocalPlacement = {
  position: [number, number, number];
  rotationY: number;
};

export function buildTableChairPlacements(
  size: VenueTableSize,
  includedChairs: number,
): ChairLocalPlacement[] {
  const cfg = TABLE_WORLD[size];
  const n = Math.max(1, includedChairs);
  const r = cfg.tableRadius + CHAIR_SEAT.depth * 0.5 + CHAIR_TABLE_EDGE_GAP;
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    return {
      position: [x, 0, z] as [number, number, number],
      rotationY: Math.atan2(x, z) + Math.PI,
    };
  });
}
