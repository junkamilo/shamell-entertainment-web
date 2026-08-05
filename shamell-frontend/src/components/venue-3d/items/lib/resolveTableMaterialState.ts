import { VENUE_COLORS } from "../../lib/venueSceneConstants";

export type TableMaterialState = {
  topColor: string;
  baseColor: string;
  emissive: string;
  emissiveIntensity: number;
};

/** Pure selected/reserved → table material state (frozen colors). */
export function resolveTableMaterialState(
  selected: boolean,
  reserved: boolean,
): TableMaterialState {
  if (reserved) {
    return {
      topColor: VENUE_COLORS.tableTopReserved,
      baseColor: VENUE_COLORS.tableBaseReserved,
      emissive: "#000000",
      emissiveIntensity: 0,
    };
  }
  return {
    topColor: VENUE_COLORS.tableTop,
    baseColor: VENUE_COLORS.tableBase,
    emissive: selected ? "#332200" : "#000000",
    emissiveIntensity: selected ? 0.3 : 0,
  };
}

/** Spawn scale step used by CatalogTableMesh useFrame (frozen). */
export function nextSpawnScale(current: number, step = 0.08): number {
  return Math.min(1, current + step);
}
