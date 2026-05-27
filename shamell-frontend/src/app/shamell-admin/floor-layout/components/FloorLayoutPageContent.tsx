"use client";

import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { useFloorLayoutEditor } from "../hooks/useFloorLayoutEditor";
import { TABLE_SIZE_LABELS } from "../types/floorLayout.types";
import type { VenueTableSize } from "../types/floorLayout.types";
import FloorLayoutScene3D from "./FloorLayoutScene3D";
import FloorLayoutPalette from "./FloorLayoutPalette";
import FloorLayoutToolbar from "./FloorLayoutToolbar";

export default function FloorLayoutPageContent() {
  const editor = useFloorLayoutEditor();
  const [dragLabel, setDragLabel] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
  );

  if (editor.loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-shamell-text-primary">
        Loading floor layout…
      </div>
    );
  }

  if (editor.error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-shamell-danger">{editor.error}</p>
        <button
          type="button"
          onClick={() => void editor.load()}
          className="rounded-md border border-shamell-line-soft px-4 py-2 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => {
        const drag = e.active.data.current?.paletteDrag as
          | { type: "table"; size: VenueTableSize }
          | { type: "chair" }
          | undefined;
        if (drag?.type === "table") {
          setDragLabel(`${TABLE_SIZE_LABELS[drag.size]} table`);
        } else if (drag?.type === "chair") {
          setDragLabel("Chair");
        }
      }}
      onDragEnd={(e) => {
        setDragLabel(null);
        editor.handleDragEnd(e);
      }}
      onDragCancel={() => setDragLabel(null)}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {editor.hasLegacyItems ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-shamell-text-primary">
            <p>
              This layout uses an older format and cannot be saved until placed items are
              cleared.
            </p>
            <button
              type="button"
              onClick={editor.clearAllItems}
              className="rounded-lg border border-amber-500/50 px-3 py-1.5 text-xs font-medium hover:bg-amber-500/20"
            >
              Clear placed items
            </button>
          </div>
        ) : null}
        <FloorLayoutToolbar chairTotal={editor.chairTotal} dirty={editor.dirty} />
        <div className="flex min-h-0 flex-1 flex-col">
          <FloorLayoutPalette palette={editor.palette} />
          <div className="flex min-h-[min(360px,50dvh)] flex-1 flex-col lg:min-h-[clamp(480px,65dvh,860px)]">
            <FloorLayoutScene3D
              sceneHandleRef={editor.sceneHandleRef}
              viewBoxWidth={editor.layoutMeta.viewBoxWidth}
              viewBoxHeight={editor.layoutMeta.viewBoxHeight}
              items={editor.items}
              selectedId={editor.selectedId}
              onSelect={editor.setSelectedId}
              onMoveItem={editor.moveItem}
              dirty={editor.dirty}
              saving={editor.saving}
              onSave={() => void editor.save()}
              onRotateLeft={() => {
                if (editor.selectedId) editor.updateRotation(editor.selectedId, -15);
              }}
              onRotateRight={() => {
                if (editor.selectedId) editor.updateRotation(editor.selectedId, 15);
              }}
              onDelete={editor.removeSelected}
            />
            <p className="shrink-0 border-t border-shamell-line-soft/60 px-3 py-1.5 text-center text-[10px] leading-snug text-shamell-text-primary/55 sm:text-left">
              Drag items to move · right-click or one finger to pan · scroll or pinch to zoom ·
              toolbar to rotate, delete, or save
            </p>
          </div>
        </div>
      </div>
      <DragOverlay>
        {dragLabel ? (
          <div className="rounded-lg border border-shamell-gold bg-shamell-twilight px-3 py-2 text-xs text-white shadow-lg">
            {dragLabel}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
