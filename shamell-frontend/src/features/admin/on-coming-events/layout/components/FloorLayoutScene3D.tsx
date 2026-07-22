"use client";

import VenueScene3D, { type VenueScene3DHandle } from "@/components/venue-3d/VenueScene3D";
import { useVenueSceneLayout } from "@/components/venue-3d/useVenueSceneLayout";
import { isSceneSelectId } from "@/components/venue-3d/floorSceneZonesDefaults";
import type { LayoutItemLabel } from "@/lib/venueSeatDisplayLabel";
import type { FloorSceneZones, PlacedLayoutItem } from "../types/floorLayout.types";
import FloorLayoutEditorActions, { sceneSelectionLabel } from "./FloorLayoutEditorActions";
import PlacedItemsLayer3d from "./PlacedItemsLayer3d";
import SceneDecorEditorLayer from "./SceneDecorEditorLayer";

type Props = {
  viewBoxWidth: number;
  viewBoxHeight: number;
  items: PlacedLayoutItem[];
  sceneZones: FloorSceneZones;
  reservedIds?: Set<string>;
  reservedLabels?: ReadonlyMap<string, string>;
  itemLabels?: ReadonlyMap<string, LayoutItemLabel>;
  selectedId: string | null;
  sceneHandleRef: React.RefObject<VenueScene3DHandle | null>;
  canvasContainerRef: React.RefObject<HTMLDivElement | null>;
  paletteDragOver?: boolean;
  onSelect: (id: string | null) => void;
  onMoveItem: (id: string, x: number, y: number) => void;
  onMoveStage: (x: number, z: number) => void;
  onReservedSelect?: (id: string) => void;
  allowItemDrag?: boolean;
  showEditorActions?: boolean;
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onDelete: () => void;
};

export default function FloorLayoutScene3D({
  viewBoxWidth,
  viewBoxHeight,
  items,
  sceneZones,
  reservedIds,
  reservedLabels,
  itemLabels,
  selectedId,
  sceneHandleRef,
  canvasContainerRef,
  paletteDragOver = false,
  onSelect,
  onMoveItem,
  onMoveStage,
  onReservedSelect,
  allowItemDrag = true,
  showEditorActions = true,
  dirty,
  saving,
  onSave,
  onRotateLeft,
  onRotateRight,
  onDelete,
}: Props) {
  const sceneLayout = useVenueSceneLayout("admin");

  const sceneDecorAdmin = (
    <SceneDecorEditorLayer
      sceneZones={sceneZones}
      selectedId={selectedId}
      onSelect={onSelect}
      onMoveStage={onMoveStage}
    />
  );

  const placedItemsAdmin = (
    <PlacedItemsLayer3d
      items={items}
      viewBoxWidth={viewBoxWidth}
      viewBoxHeight={viewBoxHeight}
      selectedId={selectedId}
      reservedIds={reservedIds}
      reservedLabels={reservedLabels}
      itemLabels={itemLabels}
      onSelect={onSelect}
      onReservedSelect={onReservedSelect}
      onMoveItem={onMoveItem}
      allowDrag={allowItemDrag}
    />
  );

  return (
    <div
      ref={canvasContainerRef}
      className={`relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border transition ${
        paletteDragOver ? "border-shamell-gold ring-2 ring-shamell-gold/30" : "border-shamell-line-soft"
      }`}
      style={{ touchAction: "none" }}
    >
      <div className="absolute inset-0 bg-[#2a2228]">
        <VenueScene3D
          mode="admin"
          viewportHeight="100%"
          viewportMinHeight="0"
          layoutBucket={sceneLayout.bucket}
          dpr={sceneLayout.dpr}
          perfProfile={sceneLayout.perfProfile}
          viewBoxWidth={viewBoxWidth}
          viewBoxHeight={viewBoxHeight}
          items={items}
          sceneZones={sceneZones}
          selectedId={selectedId}
          onSelect={onSelect}
          onBackgroundClick={() => onSelect(null)}
          canvasRef={sceneHandleRef}
          placedItemsAdmin={placedItemsAdmin}
          sceneDecorAdmin={sceneDecorAdmin}
        />
      </div>
      {showEditorActions ? (
        <FloorLayoutEditorActions
          className="absolute top-auto right-4 bottom-[max(0.75rem,env(safe-area-inset-bottom,0px))] left-4 z-[120] max-w-none sm:left-auto sm:max-w-[min(100%,20rem)] lg:max-w-none"
          dirty={dirty}
          saving={saving}
          selectedId={selectedId}
          canDeleteSelected={!isSceneSelectId(selectedId)}
          selectionLabel={sceneSelectionLabel(selectedId)}
          onSave={onSave}
          onRotateLeft={onRotateLeft}
          onRotateRight={onRotateRight}
          onDelete={onDelete}
        />
      ) : null}
    </div>
  );
}
