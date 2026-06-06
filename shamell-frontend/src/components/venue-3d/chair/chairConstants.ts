import { VENUE_COLORS } from "../venueSceneConstants";

/** Local chair: front faces +Z, backrest toward -Z. */
export const CHAIR_SEAT = {
  width: 0.42,
  depth: 0.4,
  height: 0.08,
  y: 0.38,
  cornerRadius: 0.06,
};

export const CHAIR_BACK = {
  width: 0.36,
  height: 0.4,
  thickness: 0.06,
  z: -0.2,
  topRadius: 0.08,
};

export const CHAIR_LEG = {
  radius: 0.018,
  height: 0.36,
};

export const CHAIR_COLORS = {
  frame: "#1a1210",
  velvet: VENUE_COLORS.chair,
  velvetHighlight: VENUE_COLORS.chairHighlight,
  frameReserved: VENUE_COLORS.chairFrameReserved,
  velvetReserved: VENUE_COLORS.chairReserved,
};

export const CHAIR_MATERIAL = {
  velvet: { roughness: 0.92, metalness: 0.02 },
  frame: { roughness: 0.85, metalness: 0.08 },
};
