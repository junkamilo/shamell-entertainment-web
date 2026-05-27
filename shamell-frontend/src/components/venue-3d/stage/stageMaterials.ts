/** Stage zone palette (mockup Shamell lounge). */
export const STAGE_COLORS = {
  stageWood: "#2d1e18",
  stagePlank: "#352218",
  stagePlankAlt: "#4a3228",
  stageSkirt: "#1a1008",
  marqueeBulb: "#ffdd88",
  marqueeWire: "#5c4a20",
  palmFrond: "#3d4a1a",
  palmFrondEmissive: "#554422",
  velvetRed: "#7a1228",
  backdrop: "#0a0a0a",
  wallSconce: "#cc3322",
} as const;

export const STAGE_MATERIAL = {
  wood: { roughness: 0.72, metalness: 0.05 },
  plank: { roughness: 0.58, metalness: 0.08 },
  skirt: { roughness: 0.88, metalness: 0.02 },
  velvet: { roughness: 0.92, metalness: 0.0 },
  bulb: { emissiveIntensity: 3.5 },
} as const;
