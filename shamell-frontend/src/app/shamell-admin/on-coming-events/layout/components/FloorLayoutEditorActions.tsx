"use client";

import { RotateCcw, RotateCw, Save, Trash2 } from "lucide-react";
import {
  SCENE_CARPET_SELECT_ID,
  SCENE_STAGE_SELECT_ID,
} from "@/components/venue-3d/floorSceneZonesDefaults";

type Props = {
  dirty: boolean;
  saving: boolean;
  selectedId: string | null;
  canDeleteSelected?: boolean;
  selectionLabel?: string | null;
  onSave: () => void;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  onDelete: () => void;
  className?: string;
};

const btnBase =
  "inline-flex min-h-9 min-w-9 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium shadow-lg backdrop-blur-md transition disabled:opacity-40 max-sm:min-h-11 max-sm:min-w-11";

export default function FloorLayoutEditorActions({
  dirty,
  saving,
  selectedId,
  canDeleteSelected = true,
  selectionLabel,
  onSave,
  onRotateLeft,
  onRotateRight,
  onDelete,
  className,
}: Props) {
  const deleteDisabled = !selectedId || !canDeleteSelected;

  return (
    <div
      className={`pointer-events-auto isolate flex flex-col items-start gap-1.5 ${className ?? ""}`}
    >
      {selectionLabel ? (
        <p className="rounded-md border border-shamell-gold/40 bg-black/75 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-shamell-gold">
          {selectionLabel}
        </p>
      ) : null}
      <div
        className="flex flex-wrap items-center justify-start gap-2 max-sm:left-2 max-sm:right-2"
        role="toolbar"
        aria-label="Layout editor actions"
      >
      <button
        type="button"
        disabled={!selectedId}
        onClick={onRotateLeft}
        className={`${btnBase} border-shamell-line-soft bg-black/80 text-shamell-text-primary hover:border-shamell-gold/50 hover:bg-black/90`}
        title="Rotate left 15°"
      >
        <RotateCcw className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">-15°</span>
      </button>
      <button
        type="button"
        disabled={!selectedId}
        onClick={onRotateRight}
        className={`${btnBase} border-shamell-line-soft bg-black/80 text-shamell-text-primary hover:border-shamell-gold/50 hover:bg-black/90`}
        title="Rotate right 15°"
      >
        <RotateCw className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">+15°</span>
      </button>
      <button
        type="button"
        disabled={deleteDisabled}
        onClick={onDelete}
        title={
          !canDeleteSelected && selectedId
            ? "Stage and carpet cannot be deleted"
            : undefined
        }
        className={`${btnBase} border-shamell-danger/50 bg-black/80 text-shamell-danger hover:border-shamell-danger hover:bg-red-950/60`}
      >
        <Trash2 className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">Delete</span>
      </button>
      <button
        type="button"
        disabled={!dirty || saving}
        onClick={onSave}
        className={`${btnBase} min-w-[5.5rem] border-shamell-gold/40 bg-shamell-fire font-semibold text-white hover:bg-shamell-fire/90 disabled:opacity-50`}
      >
        <Save className="h-4 w-4 shrink-0" />
        {saving ? "Saving…" : "Save"}
      </button>
      </div>
    </div>
  );
}

export function sceneSelectionLabel(selectedId: string | null): string | null {
  if (selectedId === SCENE_STAGE_SELECT_ID) return "Tarima";
  if (selectedId === SCENE_CARPET_SELECT_ID) return "Tapete";
  return null;
}
