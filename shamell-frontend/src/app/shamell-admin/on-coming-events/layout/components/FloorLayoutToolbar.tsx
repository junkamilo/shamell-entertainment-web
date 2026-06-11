"use client";

import type { FloorLayoutEditorMode } from "../hooks/useFloorLayoutEditor";
import FloorLayoutPublishToggle from "./FloorLayoutPublishToggle";

type Props = {
  chairTotal: number;
  dirty: boolean;
  editorMode: FloorLayoutEditorMode;
  onEditorModeChange: (mode: FloorLayoutEditorMode) => void;
};

export default function FloorLayoutToolbar({
  chairTotal,
  dirty,
  editorMode,
  onEditorModeChange,
}: Props) {
  return (
    <header className="shrink-0 border-b border-shamell-line-soft px-3 py-2 sm:px-4 sm:py-3">
      <div className="flex flex-wrap items-center justify-between gap-2 lg:items-start lg:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-shamell-gold sm:text-sm">
            Chairs:{" "}
            <span className="font-semibold text-shamell-text-primary">{chairTotal}</span>
            {dirty && editorMode === "edit" ? (
              <span className="ml-2 text-shamell-fireOrange">Unsaved</span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="inline-flex rounded-lg border border-shamell-line-soft p-0.5"
            role="tablist"
            aria-label="Layout editor mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={editorMode === "edit"}
              onClick={() => onEditorModeChange("edit")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                editorMode === "edit"
                  ? "bg-shamell-gold text-black"
                  : "text-shamell-text-primary/75 hover:bg-white/5"
              }`}
            >
              Edit layout
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={editorMode === "reserve"}
              onClick={() => onEditorModeChange("reserve")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                editorMode === "reserve"
                  ? "bg-shamell-gold text-black"
                  : "text-shamell-text-primary/75 hover:bg-white/5"
              }`}
            >
              Reserve seats
            </button>
          </div>
          <FloorLayoutPublishToggle />
        </div>
      </div>
    </header>
  );
}
