import { SHAMELL_ADMIN_COLORS } from "@/lib/theme/shamell-admin-colors";
import type { VenueTableSize } from "./layoutTypes";

export type ShapeVisual = {
  label: string;
  fill: string;
  stroke: string;
  size: number;
  width?: number;
  height?: number;
  shape: "circle" | "rect";
};

const TABLE_VISUAL_BY_SIZE: Record<VenueTableSize, ShapeVisual> = {
  LARGE: {
    label: "Large table",
    fill: "#C4B5E8",
    stroke: "#6B5B95",
    size: 28,
    shape: "circle",
  },
  MEDIUM: {
    label: "Medium table",
    fill: "#C4B5E8",
    stroke: "#6B5B95",
    size: 22,
    shape: "circle",
  },
  SMALL: {
    label: "Small table",
    fill: "#C4B5E8",
    stroke: "#6B5B95",
    size: 17,
    shape: "circle",
  },
};

export const STANDALONE_CHAIR_VISUAL: ShapeVisual = {
  label: "Chair",
  fill: "#8b1530",
  stroke: "#5a1020",
  size: 10,
  width: 20,
  height: 20,
  shape: "rect",
};

export function tableVisualForSize(size: VenueTableSize): ShapeVisual {
  return TABLE_VISUAL_BY_SIZE[size];
}

export const SELECTION_STROKE = SHAMELL_ADMIN_COLORS.goldBright;
