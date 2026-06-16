"use client";

import { useMemo } from "react";
import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";
import type { LayoutItemLabel } from "@/lib/venueSeatDisplayLabel";
import { layoutToWorld } from "./layoutCoords3d";
import CatalogTableMesh from "./CatalogTableMesh";
import InstancedBanquetChairs from "./chair/InstancedBanquetChairs";
import { buildChairInstancesFromItems } from "./chair/chairInstanceBuilder";
import ReservationSpeechBubble from "./ReservationSpeechBubble";
import StandaloneChairMesh from "./StandaloneChairMesh";
import VenueItemNumberBubble from "./VenueItemNumberBubble";
import type { VenuePerfProfile } from "./venueScenePerformance";
import { shouldShowItemLabels } from "./venueScenePerformance";

type Props = {
  items: PlacedLayoutItem[];
  viewBoxWidth: number;
  viewBoxHeight: number;
  selectedId?: string | null;
  reservedIds?: Set<string>;
  reservedLabels?: ReadonlyMap<string, string>;
  itemLabels?: ReadonlyMap<string, LayoutItemLabel>;
  interactive?: boolean;
  onSelect?: (id: string) => void;
  onReservedSelect?: (id: string) => void;
  onItemPointerDown?: (id: string, e: import("@react-three/fiber").ThreeEvent<PointerEvent>) => void;
  pointerCursor?: boolean;
  perfProfile?: VenuePerfProfile;
  useInstancedChairs?: boolean;
};

export default function PlacedItemsLayer({
  items,
  viewBoxWidth,
  viewBoxHeight,
  selectedId = null,
  reservedIds,
  reservedLabels: _reservedLabels,
  itemLabels,
  interactive = false,
  onSelect,
  onReservedSelect,
  onItemPointerDown,
  pointerCursor = false,
  perfProfile = "high",
  useInstancedChairs = false,
}: Props) {
  const chairInstances = useMemo(
    () =>
      useInstancedChairs
        ? buildChairInstancesFromItems(
            items,
            viewBoxWidth,
            viewBoxHeight,
            selectedId,
            reservedIds,
          )
        : [],
    [items, viewBoxWidth, viewBoxHeight, selectedId, reservedIds, useInstancedChairs],
  );

  const castShadow = perfProfile !== "mobile";

  return (
    <>
      {useInstancedChairs ? (
        <InstancedBanquetChairs
          placements={chairInstances}
          perfProfile={perfProfile}
          castShadow={castShadow}
        />
      ) : null}
      {items.map((item) => {
        const { x, z } = layoutToWorld(item.x, item.y, viewBoxWidth, viewBoxHeight);
        const rotY = (item.rotation * Math.PI) / 180;
        const selected = selectedId === item.id;
        const reserved = reservedIds?.has(item.id) ?? false;
        const showLabels = shouldShowItemLabels(perfProfile, selected);
        const reservedBubbleHeight = item.kind === "catalog_table" ? 1.35 : 1.05;
        const numberBubbleHeight = reserved
          ? item.kind === "catalog_table"
            ? 0.72
            : 0.58
          : item.kind === "catalog_table"
            ? 0.95
            : 0.75;
        const itemLabel = itemLabels?.get(item.id);

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
                perfProfile={perfProfile}
                renderChairs={!useInstancedChairs}
              />
            ) : useInstancedChairs ? (
              <mesh position={[0, 0.45, 0]}>
                <boxGeometry args={[0.44, 0.9, 0.44]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              </mesh>
            ) : (
              <StandaloneChairMesh
                selected={selected && !reserved}
                reserved={reserved}
                perfProfile={perfProfile}
              />
            )}
            {showLabels && itemLabel ? (
              <VenueItemNumberBubble
                shortLabel={itemLabel.short}
                fullLabel={itemLabel.full}
                height={numberBubbleHeight}
                variant={item.kind === "catalog_table" ? "table" : "chair"}
              />
            ) : null}
            {showLabels && reserved ? (
              <ReservationSpeechBubble height={reservedBubbleHeight} />
            ) : null}
          </group>
        );
      })}
    </>
  );
}
