"use client";

import { createContext, useContext } from "react";

export type VenueSceneCanvasContextValue = {
  getCanvas: () => HTMLCanvasElement | null;
  setOrbitEnabled: (enabled: boolean) => void;
};

export const VenueSceneCanvasContext = createContext<VenueSceneCanvasContextValue>({
  getCanvas: () => null,
  setOrbitEnabled: () => {},
});

export function useVenueSceneCanvas() {
  return useContext(VenueSceneCanvasContext);
}
