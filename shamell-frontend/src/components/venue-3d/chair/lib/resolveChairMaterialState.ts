import { CHAIR_COLORS } from "./chairConstants";

export type ChairMaterialState = {
  velvet: string;
  frame: string;
  emissiveIntensity: number;
};

/** Pure selected/reserved → chair material state (frozen colors). */
export function resolveChairMaterialState(
  selected: boolean,
  reserved: boolean,
): ChairMaterialState {
  if (reserved) {
    return {
      velvet: CHAIR_COLORS.velvetReserved,
      frame: CHAIR_COLORS.frameReserved,
      emissiveIntensity: 0,
    };
  }
  if (selected) {
    return {
      velvet: CHAIR_COLORS.velvetHighlight,
      frame: CHAIR_COLORS.frame,
      emissiveIntensity: 0.15,
    };
  }
  return {
    velvet: CHAIR_COLORS.velvet,
    frame: CHAIR_COLORS.frame,
    emissiveIntensity: 0,
  };
}
