import type { VenueTableSize } from "@/components/floor-layout/layoutTypes";

/** World floor footprint (Three.js X/Z); maps from layout viewBox. */
export const WORLD_WIDTH = 24;
export const WORLD_DEPTH = 22;

/** Canvas backdrop and fog (lighter plum tone — keeps Shamell mood, less crush). */
export const SCENE_BACKGROUND = "#2a2228";
export const SCENE_FOG = {
  color: SCENE_BACKGROUND,
  near: 30,
  far: 62,
} as const;

export const SCENE_LIGHTING = {
  ambient: 0.58,
  hemisphereSky: "#fff6eb",
  hemisphereGround: "#4a3228",
  hemisphereIntensity: 0.52,
  keyDirectionalIntensity: 1.45,
  keyDirectionalColor: "#fff8f0",
  fillDirectionalIntensity: 0.42,
  fillDirectionalColor: "#f0e4d4",
  roomPointIntensity: 0.55,
  environmentIntensity: 0.78,
  toneMappingExposure: 1.14,
} as const;

export const VENUE_COLORS = {
  floorWood: "#2a1810",
  floorWoodLight: "#3d2a22",
  floorWoodHighlight: "#5c4034",
  wall: "#121018",
  carpet: "#6b1020",
  carpetDark: "#4a0a18",
  stageWood: "#352218",
  stageLights: "#ffdd88",
  tableTop: "#1a1a1a",
  tableBase: "#2d2d2d",
  tableTopReserved: "#8a8a8a",
  tableBaseReserved: "#6e6e6e",
  chair: "#8b1530",
  chairReserved: "#7a7a7a",
  chairFrameReserved: "#5a5a5a",
  chairHighlight: "#a82040",
  gold: "#c9a227",
};

export const FLOOR_TEXTURE_PATH = "/venue-3d/textures/floor-wood.png";
/** Single stretch over the floor plane (no tiling). */
export const FLOOR_TEXTURE_REPEAT: [number, number] = [1, 1];

export const FLOOR_MATERIAL = {
  roughness: 0.82,
  metalness: 0.02,
  envMapIntensity: 0.55,
} as const;

export const TABLE_WORLD: Record<
  VenueTableSize,
  { tableRadius: number; tableHeight: number }
> = {
  LARGE: { tableRadius: 0.72, tableHeight: 0.42 },
  MEDIUM: { tableRadius: 0.58, tableHeight: 0.38 },
  SMALL: { tableRadius: 0.45, tableHeight: 0.34 },
};

export const CHAIR_WORLD = {
  seatWidth: 0.22,
  seatDepth: 0.2,
  seatHeight: 0.35,
};

export const CAMERA_DEFAULT = {
  position: [WORLD_WIDTH * 0.575, 16, WORLD_DEPTH * 0.627] as [number, number, number],
  target: [WORLD_WIDTH * 0.5, 0, WORLD_DEPTH * 0.46] as [number, number, number],
  fov: 42,
};

export type VenueSceneLayoutBucket = "phone" | "tablet" | "laptop" | "tv";

export type VenueCameraPreset = {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  minDistance: number;
  maxDistance: number;
};

/** Base laptop preset — baseline for regression on 1024–1919px. */
export const CAMERA_PRESET_LAPTOP: VenueCameraPreset = {
  position: [...CAMERA_DEFAULT.position],
  target: [...CAMERA_DEFAULT.target],
  fov: CAMERA_DEFAULT.fov,
  minDistance: 8,
  maxDistance: 32,
};

/** Portrait / narrow canvas — wider FOV, slightly higher camera. */
export const CAMERA_PRESET_NARROW: VenueCameraPreset = {
  position: [CAMERA_DEFAULT.position[0], 17.5, CAMERA_DEFAULT.position[2]],
  target: [CAMERA_DEFAULT.target[0], 0, WORLD_DEPTH * 0.48],
  fov: 47,
  minDistance: 7,
  maxDistance: 30,
};

/** Ultrawide / TV — pull back slightly, tighter FOV. */
export const CAMERA_PRESET_WIDE: VenueCameraPreset = {
  position: [CAMERA_DEFAULT.position[0], 17, CAMERA_DEFAULT.position[2] + 1.2],
  target: [...CAMERA_DEFAULT.target],
  fov: 39,
  minDistance: 9,
  maxDistance: 36,
};

export const CAMERA_PRESETS_BY_BUCKET: Record<VenueSceneLayoutBucket, VenueCameraPreset> = {
  phone: CAMERA_PRESET_NARROW,
  tablet: {
    ...CAMERA_PRESET_LAPTOP,
    fov: 44,
    position: [CAMERA_DEFAULT.position[0], 16.5, CAMERA_DEFAULT.position[2]],
  },
  laptop: CAMERA_PRESET_LAPTOP,
  tv: CAMERA_PRESET_WIDE,
};

export const VIEWPORT_HEIGHT_BY_BUCKET: Record<
  VenueSceneLayoutBucket,
  { public: string; admin: string; minHeight: string }
> = {
  phone: {
    public: "clamp(280px, calc(100dvh - var(--venue-chrome, 14rem)), 520px)",
    admin: "100%",
    minHeight: "min(280px, 50dvh)",
  },
  tablet: {
    public: "clamp(360px, calc(100dvh - var(--venue-chrome, 11rem)), 640px)",
    admin: "100%",
    minHeight: "min(360px, 55dvh)",
  },
  laptop: {
    public: "clamp(480px, calc(100svh - var(--venue-chrome, 12rem)), 860px)",
    admin: "100%",
    minHeight: "min(420px, 55vh)",
  },
  tv: {
    public: "clamp(560px, min(92svh, 960px), 960px)",
    admin: "100%",
    minHeight: "min(560px, 65vh)",
  },
};

export const ASPECT_NARROW_MAX = 0.85;
export const ASPECT_WIDE_MIN = 1.6;

export function resolveCameraPresetForAspect(
  bucket: VenueSceneLayoutBucket,
  aspect: number,
): VenueCameraPreset {
  if (aspect < ASPECT_NARROW_MAX) return CAMERA_PRESET_NARROW;
  if (aspect > ASPECT_WIDE_MIN) return CAMERA_PRESET_WIDE;
  return CAMERA_PRESETS_BY_BUCKET[bucket];
}

/**
 * Admin layout editor default view: an elevated front 3/4 overview that frames
 * the whole room (floor, side walls, stage backdrop and carpet). The editor
 * canvas is typically very wide and short, so wider/shorter viewports need a
 * higher camera and a wider FOV to fit the full depth of the room.
 */
export const CAMERA_PRESET_ADMIN: VenueCameraPreset = {
  position: [WORLD_WIDTH * 0.5, 20, WORLD_DEPTH * 1.22],
  target: [WORLD_WIDTH * 0.5, 0, WORLD_DEPTH * 0.4],
  fov: 50,
  minDistance: 8,
  maxDistance: 48,
};

export function resolveAdminCameraPreset(aspect: number): VenueCameraPreset {
  if (aspect > 2.0) {
    return {
      ...CAMERA_PRESET_ADMIN,
      position: [WORLD_WIDTH * 0.5, 23.5, WORLD_DEPTH * 1.42],
      fov: 56,
      maxDistance: 54,
    };
  }
  if (aspect < ASPECT_NARROW_MAX) {
    return {
      ...CAMERA_PRESET_ADMIN,
      position: [WORLD_WIDTH * 0.5, 22, WORLD_DEPTH * 1.55],
      fov: 58,
      maxDistance: 56,
    };
  }
  return CAMERA_PRESET_ADMIN;
}
