import { WORLD_DEPTH, WORLD_WIDTH } from "./venueSceneConstants";

const MARGIN_LAYOUT = 12;

export function layoutToWorld(
  layoutX: number,
  layoutY: number,
  viewBoxWidth: number,
  viewBoxHeight: number,
): { x: number; z: number } {
  return {
    x: (layoutX / viewBoxWidth) * WORLD_WIDTH,
    z: (layoutY / viewBoxHeight) * WORLD_DEPTH,
  };
}

export function worldToLayout(
  worldX: number,
  worldZ: number,
  viewBoxWidth: number,
  viewBoxHeight: number,
): { x: number; y: number } {
  const x = (worldX / WORLD_WIDTH) * viewBoxWidth;
  const y = (worldZ / WORLD_DEPTH) * viewBoxHeight;
  return {
    x: Math.min(viewBoxWidth - MARGIN_LAYOUT, Math.max(MARGIN_LAYOUT, x)),
    y: Math.min(viewBoxHeight - MARGIN_LAYOUT, Math.max(MARGIN_LAYOUT, y)),
  };
}

export function clientToLayout(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
  viewBoxWidth: number,
  viewBoxHeight: number,
  worldX: number,
  worldZ: number,
): { x: number; y: number } {
  void clientX;
  void clientY;
  void canvas;
  return worldToLayout(worldX, worldZ, viewBoxWidth, viewBoxHeight);
}
