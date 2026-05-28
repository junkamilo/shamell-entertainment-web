"use client";

import { useDroppable } from "@dnd-kit/core";
import VenueScene3D, { type VenueScene3DHandle } from "@/components/venue-3d/VenueScene3D";
import { useVenueSceneLayout } from "@/components/venue-3d/useVenueSceneLayout";
import { isSceneSelectId } from "@/components/venue-3d/floorSceneZonesDefaults";
import type { FloorSceneZones, PlacedLayoutItem } from "../types/floorLayout.types";
import { FLOOR_CANVAS_DROPPABLE_ID } from "../hooks/useFloorLayoutEditor";
import FloorLayoutEditorActions, { sceneSelectionLabel } from "./FloorLayoutEditorActions";
import PlacedItemsLayer3d from "./PlacedItemsLayer3d";
import SceneDecorEditorLayer from "./SceneDecorEditorLayer";

type Props = {
  viewBoxWidth: number;
  viewBoxHeight: number;
  items: PlacedLayoutItem[];
  sceneZones: FloorSceneZones;
  reservedIds?: Set<string>;
  newlyReservedIds?: Set<string>;
  selectedId: string | null;
  sceneHandleRef: React.RefObject<VenueScene3DHandle | null>;
  onSelect: (id: string | null) => void;
  onMoveItem: (id: string, x: number, y: number) => void;
  onMoveSceneZone: (kind: "stage" | "carpet", x: number, z: number) => void;
  onReservedSelect?: (id: string) => void;
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
  newlyReservedIds,
  selectedId,
  sceneHandleRef,
  onSelect,
  onMoveItem,
  onMoveSceneZone,
  onReservedSelect,
  dirty,
  saving,
  onSave,
  onRotateLeft,
  onRotateRight,
  onDelete,
}: Props) {
  const sceneLayout = useVenueSceneLayout("admin");
  const { setNodeRef, isOver } = useDroppable({ id: FLOOR_CANVAS_DROPPABLE_ID });

  const sceneDecorAdmin = (
    <SceneDecorEditorLayer
      sceneZones={sceneZones}
      selectedId={selectedId}
      onSelect={onSelect}
      onMoveStage={(x, z) => onMoveSceneZone("stage", x, z)}
      onMoveCarpet={(x, z) => onMoveSceneZone("carpet", x, z)}
    />
  );

  const placedItemsAdmin = (
    <PlacedItemsLayer3d
      items={items}
      viewBoxWidth={viewBoxWidth}
      viewBoxHeight={viewBoxHeight}
      selectedId={selectedId}
      reservedIds={reservedIds}
      newlyReservedIds={newlyReservedIds}
      onSelect={onSelect}
      onReservedSelect={onReservedSelect}
      onMoveItem={onMoveItem}
    />
  );

  return (
    <div
      ref={setNodeRef}
      className={`relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-lg border transition ${
        isOver ? "border-shamell-gold ring-2 ring-shamell-gold/30" : "border-shamell-line-soft"
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
      <FloorLayoutEditorActions
        className="absolute top-auto right-auto bottom-[max(1rem,env(safe-area-inset-bottom,0px))] left-4 z-[120] max-w-[min(100%,20rem)] sm:max-w-none"
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
    </div>
  );
}
