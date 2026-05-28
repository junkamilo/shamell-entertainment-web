"use client";

import { RotateCcw, RotateCw, Save, Trash2 } from "lucide-react";

type Props = {
  dirty: boolean;
  saving: boolean;
  selectedId: string | null;
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
  onSave,
  onRotateLeft,
  onRotateRight,
  onDelete,
  className,
}: Props) {
  return (
    <div
      className={`pointer-events-auto flex flex-wrap items-center justify-center gap-2 max-sm:left-2 max-sm:right-2 sm:justify-end ${className ?? ""}`}
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
        disabled={!selectedId}
        onClick={onDelete}
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
  );
}
