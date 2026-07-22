"use client";

import { ModuleHero } from "@/components/admin/layout";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PlacedLayoutItem } from "@/components/floor-layout/layoutTypes";
import { toast } from "@/hooks/use-toast";
import { SEATING_LAYOUT_ADMIN_LABEL } from "@/lib/onComingEventsRoutes";
import { buildReservedLayoutItemIdSet } from "@/lib/venueLayoutReservedIds";
import { useFloorLayoutEditor } from "../hooks/useFloorLayoutEditor";
import type { PaletteDragKind } from "../hooks/useFloorLayoutEditor";
import AdminVenueReservationModal from "./AdminVenueReservationModal";
import {
  usePaletteToFloorPointerDrag,
  type PaletteDragGhost,
} from "../lib/usePaletteToFloorPointerDrag";
import FloorLayoutScene3D from "./FloorLayoutScene3D";
import FloorLayoutPalette, { PaletteItemIcon } from "./FloorLayoutPalette";
import FloorLayoutToolbar from "./FloorLayoutToolbar";

function PaletteDragGhostOverlay({ ghost }: { ghost: PaletteDragGhost }) {
  return (
    <div
      className="pointer-events-none fixed z-[200] flex flex-col items-center gap-1 rounded-lg border border-shamell-gold bg-shamell-twilight/95 px-3 py-2 shadow-xl"
      style={{
        left: ghost.x,
        top: ghost.y,
        transform: "translate(-50%, -50%)",
      }}
      aria-hidden
    >
      <PaletteItemIcon drag={ghost.drag} />
      <span className="text-xs font-medium text-white">{ghost.label}</span>
    </div>
  );
}

export default function FloorLayoutPageContent() {
  const editor = useFloorLayoutEditor();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [paletteGhost, setPaletteGhost] = useState<PaletteDragGhost | null>(null);
  const [paletteOverCanvas, setPaletteOverCanvas] = useState(false);
  const [reservationItem, setReservationItem] = useState<PlacedLayoutItem | null>(null);
  const isReserveMode = editor.editorMode === "reserve";

  const reservedIds = useMemo(
    () =>
      buildReservedLayoutItemIdSet(
        editor.items,
        editor.reservedLayoutItemIds,
        editor.reservedVenueTableConfigIds,
        editor.itemLabels,
        editor.reservedSeatShortLabels,
      ),
    [
      editor.items,
      editor.reservedLayoutItemIds,
      editor.reservedVenueTableConfigIds,
      editor.itemLabels,
      editor.reservedSeatShortLabels,
    ],
  );
  const reservedLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const [layoutItemId, name] of Object.entries(editor.reservedLabelsByLayoutItemId)) {
      map.set(layoutItemId, name);
    }
    return map;
  }, [editor.reservedLabelsByLayoutItemId]);

  /** Hide 3D name bubbles while the reservation form is open (they use Html overlays). */
  const reservedLabelsForScene = useMemo(
    () => (reservationItem ? new Map<string, string>() : reservedLabels),
    [reservationItem, reservedLabels],
  );

  const handlePaletteTap = useCallback(
    (drag: PaletteDragKind) => {
      editor.placePaletteItemAtCenter(drag);
      if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
        toast({
          title: "Placed at center",
          description: "Drag the item to reposition it on the floor.",
        });
      }
    },
    [editor],
  );

  const { beginPalettePointer } = usePaletteToFloorPointerDrag({
    sceneHandleRef: editor.sceneHandleRef,
    canvasContainerRef,
    viewBoxWidth: editor.layoutMeta.viewBoxWidth,
    viewBoxHeight: editor.layoutMeta.viewBoxHeight,
    onDrop: editor.placePaletteItem,
    onTap: handlePaletteTap,
    onGhostChange: setPaletteGhost,
    onDragOverCanvas: setPaletteOverCanvas,
  });

  const onTilePointerDown = useCallback(
    (e: React.PointerEvent, drag: PaletteDragKind, label: string) => {
      if (isReserveMode) return;
      if (e.button !== 0) return;
      beginPalettePointer(e.nativeEvent, drag, label);
    },
    [beginPalettePointer, isReserveMode],
  );

  useEffect(() => {
    if (!isReserveMode || !editor.selectedId) {
      setReservationItem(null);
      return;
    }
    if (
      editor.reservedLayoutItemIds.includes(editor.selectedId) ||
      editor.pendingLayoutItemIds.includes(editor.selectedId)
    ) {
      setReservationItem(null);
      return;
    }
    const item = editor.items.find((row) => row.id === editor.selectedId) ?? null;
    if (
      item &&
      (item.kind === "catalog_table" || item.kind === "standalone_chair")
    ) {
      setReservationItem(item);
    } else {
      setReservationItem(null);
    }
  }, [
    editor.items,
    editor.pendingLayoutItemIds,
    editor.reservedLayoutItemIds,
    editor.selectedId,
    isReserveMode,
  ]);

  const closeReservationModal = useCallback(() => {
    setReservationItem(null);
    editor.setSelectedId(null);
  }, [editor]);

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
    <div className="mx-auto flex w-full max-w-6xl min-h-0 min-w-0 flex-1 flex-col">
      <div className="hidden shrink-0 lg:block">
        <ModuleHero
          title={SEATING_LAYOUT_ADMIN_LABEL}
          subtitle="Place tables and chairs on the interactive floor plan for upcoming events."
          bordered={false}
        />
      </div>
      <header className="shrink-0 border-b border-shamell-line-soft px-3 py-2 lg:hidden">
        <p className="font-brand text-[10px] tracking-[0.2em] text-gold/85">SHAMELL ADMIN</p>
        <h1 className="font-brand text-lg tracking-[0.06em] text-gold">{SEATING_LAYOUT_ADMIN_LABEL}</h1>
      </header>
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
        <FloorLayoutToolbar
          chairTotal={editor.chairTotal}
          dirty={editor.dirty}
          editorMode={editor.editorMode}
          onEditorModeChange={editor.setEditorMode}
        />
        <div className="flex min-h-0 flex-1 flex-col">
          {isReserveMode ? (
            <p className="shrink-0 border-b border-shamell-line-soft px-3 py-2 text-xs text-shamell-text-primary/70">
              Tap an available seat to reserve it. Paid seats appear gray with the guest name.
            </p>
          ) : (
            <FloorLayoutPalette
              palette={editor.palette}
              activePaletteDrag={paletteGhost?.drag ?? null}
              onTilePointerDown={onTilePointerDown}
            />
          )}
          <div className="flex min-h-[min(380px,52dvh)] flex-1 flex-col md:min-h-[min(440px,58dvh)] lg:min-h-[clamp(480px,65dvh,860px)]">
            <FloorLayoutScene3D
              canvasContainerRef={canvasContainerRef}
              paletteDragOver={paletteOverCanvas}
              sceneHandleRef={editor.sceneHandleRef}
              viewBoxWidth={editor.layoutMeta.viewBoxWidth}
              viewBoxHeight={editor.layoutMeta.viewBoxHeight}
              items={editor.items}
              sceneZones={editor.sceneZones}
              reservedIds={reservedIds}
              reservedLabels={reservedLabelsForScene}
              itemLabels={editor.itemLabels}
              selectedId={editor.selectedId}
              onSelect={
                isReserveMode ? editor.handlePlacedItemSelect : editor.setSelectedId
              }
              onReservedSelect={editor.onReservedItemSelect}
              onMoveItem={editor.moveItem}
              onMoveStage={editor.moveStage}
              allowItemDrag={!isReserveMode}
              showEditorActions={!isReserveMode}
              dirty={editor.dirty}
              saving={editor.saving}
              onSave={() => void editor.save()}
              onRotateLeft={() => editor.rotateSelected(-15)}
              onRotateRight={() => editor.rotateSelected(15)}
              onDelete={editor.removeSelected}
            />
            <p className="shrink-0 border-t border-shamell-line-soft/60 px-3 py-2 text-center text-[10px] leading-snug text-shamell-text-primary/55 sm:text-left">
              {isReserveMode
                ? "Tap a free seat to open the reservation form · one finger to orbit · two fingers to pan and pinch to zoom"
                : "Tap palette to add at center · drag palette items onto the floor · one finger to orbit · two fingers to pan and pinch to zoom · toolbar to rotate selection, delete, or save"}
            </p>
          </div>
        </div>
      </div>
      {paletteGhost ? <PaletteDragGhostOverlay ghost={paletteGhost} /> : null}
      {reservationItem ? (
        <AdminVenueReservationModal
          item={reservationItem}
          eventDateIso={editor.eventDateIso}
          upcomingEventSlug={editor.upcomingEventSlug}
          tableBundlePrice={
            reservationItem.kind === "catalog_table"
              ? (editor.tableBundlePriceByConfigId[reservationItem.venueTableConfigId] ??
                null)
              : null
          }
          onClose={closeReservationModal}
          onReserved={(layoutItemId, customerName) => {
            editor.applyCashReservation(layoutItemId, customerName);
          }}
        />
      ) : null}
    </div>
  );
}
