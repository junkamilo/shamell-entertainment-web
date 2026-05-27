"use client";

import { useDroppable } from "@dnd-kit/core";
import VenueScene3D, { type VenueScene3DHandle } from "@/components/venue-3d/VenueScene3D";
import { useVenueSceneLayout } from "@/components/venue-3d/useVenueSceneLayout";
import type { PlacedLayoutItem } from "../types/floorLayout.types";
import { FLOOR_CANVAS_DROPPABLE_ID } from "../hooks/useFloorLayoutEditor";
import FloorLayoutEditorActions from "./FloorLayoutEditorActions";
import PlacedItemsLayer3d from "./PlacedItemsLayer3d";

type Props = {
  viewBoxWidth: number;
  viewBoxHeight: number;
  items: PlacedLayoutItem[];
  selectedId: string | null;
  sceneHandleRef: React.RefObject<VenueScene3DHandle | null>;
  onSelect: (id: string | null) => void;
  onMoveItem: (id: string, x: number, y: number) => void;
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
  selectedId,
  sceneHandleRef,
  onSelect,
  onMoveItem,
  dirty,
  saving,
  onSave,
  onRotateLeft,
  onRotateRight,
  onDelete,
}: Props) {
  const sceneLayout = useVenueSceneLayout("admin");
  const { setNodeRef, isOver } = useDroppable({ id: FLOOR_CANVAS_DROPPABLE_ID });

  const placedItemsAdmin = (
    <PlacedItemsLayer3d
      items={items}
      viewBoxWidth={viewBoxWidth}
      viewBoxHeight={viewBoxHeight}
      selectedId={selectedId}
      onSelect={onSelect}
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
          selectedId={selectedId}
          onSelect={onSelect}
          onBackgroundClick={() => onSelect(null)}
          canvasRef={sceneHandleRef}
          placedItemsAdmin={placedItemsAdmin}
        />
      </div>
      <FloorLayoutEditorActions
        className="absolute bottom-[max(1rem,env(safe-area-inset-bottom,0px))] right-4 z-20 max-w-[min(100%,20rem)] sm:max-w-none"
        dirty={dirty}
        saving={saving}
        selectedId={selectedId}
        onSave={onSave}
        onRotateLeft={onRotateLeft}
        onRotateRight={onRotateRight}
        onDelete={onDelete}
      />
    </div>
  );
}
