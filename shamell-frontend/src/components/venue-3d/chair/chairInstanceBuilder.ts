import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";
import { layoutToWorld } from "../layoutCoords3d";
import { buildTableChairPlacements } from "./catalogTableChairPlacements";
import { CHAIR_BACK, CHAIR_LEG, CHAIR_SEAT } from "./chairConstants";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";

export type ChairInstanceState = "available" | "selected" | "reserved";

export type ChairInstancePlacement = {
  state: ChairInstanceState;
  matrix: Matrix4;
};

const _position = new Vector3();
const _quaternion = new Quaternion();
const _scale = new Vector3(1, 1, 1);
const _euler = new Euler();
const _itemMatrix = new Matrix4();
const _localMatrix = new Matrix4();
const _composed = new Matrix4();

function composeChairMatrix(
  itemX: number,
  itemZ: number,
  itemRotY: number,
  localX: number,
  localZ: number,
  localRotY: number,
): Matrix4 {
  _euler.set(0, itemRotY, 0);
  _quaternion.setFromEuler(_euler);
  _itemMatrix.compose(
    _position.set(itemX, 0, itemZ),
    _quaternion,
    _scale,
  );

  _euler.set(0, localRotY, 0);
  _quaternion.setFromEuler(_euler);
  _localMatrix.compose(
    _position.set(localX, 0, localZ),
    _quaternion,
    _scale,
  );

  return _composed.copy(_itemMatrix).multiply(_localMatrix).clone();
}

function resolveChairState(
  itemId: string,
  selectedId: string | null | undefined,
  reservedIds: Set<string> | undefined,
): ChairInstanceState {
  if (reservedIds?.has(itemId)) return "reserved";
  if (selectedId === itemId) return "selected";
  return "available";
}

export function buildChairInstancesFromItems(
  items: PlacedLayoutItem[],
  viewBoxWidth: number,
  viewBoxHeight: number,
  selectedId: string | null | undefined,
  reservedIds?: Set<string>,
): ChairInstancePlacement[] {
  const placements: ChairInstancePlacement[] = [];

  for (const item of items) {
    const { x, z } = layoutToWorld(item.x, item.y, viewBoxWidth, viewBoxHeight);
    const itemRotY = (item.rotation * Math.PI) / 180;
    const state = resolveChairState(item.id, selectedId, reservedIds);

    if (item.kind === "catalog_table") {
      const chairs = buildTableChairPlacements(item.size, item.includedChairs);
      for (const chair of chairs) {
        placements.push({
          state,
          matrix: composeChairMatrix(
            x,
            z,
            itemRotY,
            chair.position[0],
            chair.position[2],
            chair.rotationY,
          ),
        });
      }
    } else {
      placements.push({
        state,
        matrix: composeChairMatrix(x, z, itemRotY, 0, 0, 0),
      });
    }
  }

  return placements;
}

/** Local offsets for instanced chair parts (relative to chair origin). */
export const CHAIR_LEG_OFFSETS: [number, number, number][] = (() => {
  const legInsetX = CHAIR_SEAT.width * 0.38;
  const legInsetZ = CHAIR_SEAT.depth * 0.38;
  const y = CHAIR_LEG.height / 2;
  return [
    [-legInsetX, y, -legInsetZ],
    [legInsetX, y, -legInsetZ],
    [-legInsetX, y, legInsetZ],
    [legInsetX, y, legInsetZ],
  ];
})();

export const CHAIR_SEAT_OFFSET: [number, number, number] = [0, CHAIR_SEAT.y, 0];
export const CHAIR_BACK_OFFSET: [number, number, number] = [
  0,
  CHAIR_SEAT.y + CHAIR_BACK.height * 0.35,
  CHAIR_BACK.z,
];
export const CHAIR_BACK_CAP_OFFSET: [number, number, number] = [
  0,
  CHAIR_SEAT.y + CHAIR_BACK.height * 0.72,
  CHAIR_BACK.z,
];
