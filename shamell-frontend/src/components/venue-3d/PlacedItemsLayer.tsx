"use client";

import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";
import { layoutToWorld } from "./layoutCoords3d";
import CatalogTableMesh from "./CatalogTableMesh";
import ReservationSpeechBubble from "./ReservationSpeechBubble";
import StandaloneChairMesh from "./StandaloneChairMesh";

type Props = {
  items: PlacedLayoutItem[];
  viewBoxWidth: number;
  viewBoxHeight: number;
  selectedId?: string | null;
  reservedIds?: Set<string>;
  reservedLabels?: ReadonlyMap<string, string>;
  interactive?: boolean;
  onSelect?: (id: string) => void;
  onReservedSelect?: (id: string) => void;
  onItemPointerDown?: (id: string, e: import("@react-three/fiber").ThreeEvent<PointerEvent>) => void;
  pointerCursor?: boolean;
};

export default function PlacedItemsLayer({
  items,
  viewBoxWidth,
  viewBoxHeight,
  selectedId = null,
  reservedIds,
  reservedLabels,
  interactive = false,
  onSelect,
  onReservedSelect,
  onItemPointerDown,
  pointerCursor = false,
}: Props) {
  return (
    <>
      {items.map((item) => {
        const { x, z } = layoutToWorld(item.x, item.y, viewBoxWidth, viewBoxHeight);
        const rotY = (item.rotation * Math.PI) / 180;
        const selected = selectedId === item.id;
        const reserved = reservedIds?.has(item.id) ?? false;
        const holderName = reserved ? reservedLabels?.get(item.id) : undefined;
        const bubbleHeight = item.kind === "catalog_table" ? 1.35 : 1.05;

        return (
          <group
            key={item.id}
            position={[x, 0, z]}
            rotation={[0, rotY, 0]}
            onClick={
              interactive
                ? (e) => {
                    e.stopPropagation();
                    if (reserved) {
                      onReservedSelect?.(item.id);
                      return;
                    }
                    onSelect?.(item.id);
                  }
                : undefined
            }
            onPointerDown={
              interactive && !reserved
                ? (e) => {
                    if (e.button !== 0) return;
                    e.stopPropagation();
                    onItemPointerDown?.(item.id, e);
                  }
                : undefined
            }
            onPointerOver={
              pointerCursor && !reserved
                ? (e) => {
                    e.stopPropagation();
                    document.body.style.cursor = "pointer";
                  }
                : undefined
            }
            onPointerOut={
              pointerCursor
                ? () => {
                    document.body.style.cursor = "";
                  }
                : undefined
            }
          >
            {item.kind === "catalog_table" ? (
              <CatalogTableMesh
                size={item.size}
                includedChairs={item.includedChairs}
                tableName={item.tableName}
                selected={selected && !reserved}
                reserved={reserved}
              />
            ) : (
              <StandaloneChairMesh selected={selected && !reserved} reserved={reserved} />
            )}
            {reserved && holderName ? (
              <ReservationSpeechBubble name={holderName} height={bubbleHeight} />
            ) : null}
          </group>
        );
      })}
    </>
  );
}
