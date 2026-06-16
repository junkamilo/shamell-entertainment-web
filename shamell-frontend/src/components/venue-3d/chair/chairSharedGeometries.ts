import {
  BoxGeometry,
  CylinderGeometry,
  type BufferGeometry,
} from "three";
import type { VenuePerfProfile } from "../venueScenePerformance";
import { CHAIR_BACK, CHAIR_LEG, CHAIR_SEAT } from "./chairConstants";

export type ChairSharedGeometries = {
  leg: CylinderGeometry;
  seat: BoxGeometry;
  back: BoxGeometry;
  backCap: CylinderGeometry;
};

let highGeometries: ChairSharedGeometries | null = null;
let mobileGeometries: ChairSharedGeometries | null = null;

function createChairGeometries(profile: VenuePerfProfile): ChairSharedGeometries {
  const legSegs = profile === "mobile" ? 6 : 8;
  const capSegs = profile === "mobile" ? 8 : 12;

  return {
    leg: new CylinderGeometry(
      CHAIR_LEG.radius,
      CHAIR_LEG.radius * 0.85,
      CHAIR_LEG.height,
      legSegs,
    ),
    seat: new BoxGeometry(CHAIR_SEAT.width, CHAIR_SEAT.height, CHAIR_SEAT.depth),
    back: new BoxGeometry(CHAIR_BACK.width, CHAIR_BACK.height, CHAIR_BACK.thickness),
    backCap: new CylinderGeometry(
      CHAIR_BACK.topRadius,
      CHAIR_BACK.topRadius * 0.9,
      0.06,
      capSegs,
    ),
  };
}

export function getChairSharedGeometries(profile: VenuePerfProfile): ChairSharedGeometries {
  if (profile === "mobile") {
    if (!mobileGeometries) mobileGeometries = createChairGeometries("mobile");
    return mobileGeometries;
  }
  if (!highGeometries) highGeometries = createChairGeometries("high");
  return highGeometries;
}

export type TableSharedGeometries = {
  top: CylinderGeometry;
  pedestal: CylinderGeometry;
  accent: CylinderGeometry;
};

function createTableGeometries(
  tableRadius: number,
  tableHeight: number,
  profile: VenuePerfProfile,
): TableSharedGeometries {
  const topSegs = profile === "mobile" ? 16 : 24;
  const pedestalSegs = profile === "mobile" ? 12 : 16;

  return {
    top: new CylinderGeometry(tableRadius, tableRadius * 0.92, 0.08, topSegs),
    pedestal: new CylinderGeometry(
      tableRadius * 0.35,
      tableRadius * 0.5,
      tableHeight * 0.85,
      pedestalSegs,
    ),
    accent: new CylinderGeometry(0.04, 0.04, 0.02, profile === "mobile" ? 8 : 12),
  };
}

const tableGeometryCache = new Map<string, TableSharedGeometries>();

export function getTableSharedGeometries(
  tableRadius: number,
  tableHeight: number,
  profile: VenuePerfProfile,
): TableSharedGeometries {
  const key = `${profile}:${tableRadius}:${tableHeight}`;
  const cached = tableGeometryCache.get(key);
  if (cached) return cached;

  const geometries = createTableGeometries(tableRadius, tableHeight, profile);
  tableGeometryCache.set(key, geometries);
  return geometries;
}

export function disposeGeometry(geometry: BufferGeometry) {
  geometry.dispose();
}
