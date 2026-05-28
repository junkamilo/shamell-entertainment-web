"use client";

import { createContext, useContext } from "react";
import type { FloorSceneZones } from "@/components/floor-layout/layoutTypes";
import { DEFAULT_FLOOR_SCENE_ZONES } from "./floorSceneZonesDefaults";

const FloorSceneZonesContext = createContext<FloorSceneZones>(DEFAULT_FLOOR_SCENE_ZONES);

export function FloorSceneZonesProvider({
  zones,
  children,
}: {
  zones: FloorSceneZones;
  children: React.ReactNode;
}) {
  return (
    <FloorSceneZonesContext.Provider value={zones}>{children}</FloorSceneZonesContext.Provider>
  );
}

export function useFloorSceneZones(): FloorSceneZones {
  return useContext(FloorSceneZonesContext);
}
