"use client";

import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";
import { layoutToWorld } from "./layoutCoords3d";
import CatalogTableMesh from "./CatalogTableMesh";
import StandaloneChairMesh from "./StandaloneChairMesh";

type Props = {
  items: PlacedLayoutItem[];
  viewBoxWidth: number;
  viewBoxHeight: number;
  selectedId?: string | null;
  reservedIds?: Set<string>;
  interactive?: boolean;
  onSelect?: (id: string) => void;
  onItemPointerDown?: (id: string, e: import("@react-three/fiber").ThreeEvent<PointerEvent>) => void;
  pointerCursor?: boolean;
};

export default function PlacedItemsLayer({
  items,
  viewBoxWidth,
  viewBoxHeight,
  selectedId = null,
  reservedIds,
  interactive = false,
  onSelect,
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

        return (
          <group
            key={item.id}
            position={[x, 0, z]}
            rotation={[0, rotY, 0]}
            onClick={
              interactive && !reserved
                ? (e) => {
                    e.stopPropagation();
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
                selected={selected}
                reserved={reserved}
              />
            ) : (
              <StandaloneChairMesh selected={selected} reserved={reserved} />
            )}
          </group>
        );
      })}
    </>
  );
}
