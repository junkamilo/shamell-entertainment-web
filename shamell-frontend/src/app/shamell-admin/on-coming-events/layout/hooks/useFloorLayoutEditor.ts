"use client";

import type { DragEndEvent } from "@dnd-kit/core";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import { pickFloorFromClient } from "../lib/floorLayoutRaycast";
import type { VenueScene3DHandle } from "@/components/venue-3d/VenueScene3D";
import { totalChairs } from "../lib/floorLayoutStats";
import { fetchAdminFloorLayout } from "../services/fetchAdminFloorLayout";
import { fetchAdminFloorLayoutPalette } from "../services/fetchAdminFloorLayoutPalette";
import { putAdminFloorLayout } from "../services/putAdminFloorLayout";
import { fetchAdminVenueReservations } from "@/app/shamell-admin/venue-reservations/services/fetchAdminVenueReservations";
import { VENUE_RESERVATIONS_ADMIN_PATH } from "@/app/shamell-admin/venue-reservations/lib/venueReservationsRoutes";
import {
  notifyOnComingEventsBadgeRefresh,
  readLastSeenPaidReservationAtMs,
  writeLastSeenPaidReservationAtMs,
} from "@/lib/onComingEventsReservationsNotice";
import {
  isSceneSelectId,
  SCENE_CARPET_SELECT_ID,
  SCENE_STAGE_SELECT_ID,
} from "@/components/venue-3d/floorSceneZonesDefaults";
import { DEFAULT_FLOOR_SCENE_ZONES } from "../lib/floorSceneZones.defaults";
import type {
  FloorLayoutPalette,
  FloorSceneZones,
  PlacedLayoutItem,
  VenueFloorLayout,
  VenueTableSize,
} from "../types/floorLayout.types";
import {
  DEFAULT_VIEW_BOX_HEIGHT,
  DEFAULT_VIEW_BOX_WIDTH,
  TABLE_SIZE_LABELS,
} from "../types/floorLayout.types";

export const FLOOR_CANVAS_DROPPABLE_ID = "floor-canvas";

export type DragSource = "palette" | "placed";

export type PaletteDragKind =
  | { type: "table"; size: VenueTableSize }
  | { type: "chair" };

const EMPTY_PALETTE: FloorLayoutPalette = {
  tablesBySize: { LARGE: 0, MEDIUM: 0, SMALL: 0 },
  standaloneChairsAvailable: 0,
  unplacedTables: [],
  unplacedChairs: [],
  placedTableIds: [],
  placedChairIds: [],
  placedChairCount: 0,
};

export function useFloorLayoutEditor() {
  const router = useRouter();
  const sceneHandleRef = useRef<VenueScene3DHandle | null>(null);
  const [layoutMeta, setLayoutMeta] = useState({
    id: null as string | null,
    viewBoxWidth: DEFAULT_VIEW_BOX_WIDTH,
    viewBoxHeight: DEFAULT_VIEW_BOX_HEIGHT,
    backgroundVersion: "v1",
  });
  const [items, setItems] = useState<PlacedLayoutItem[]>([]);
  const [sceneZones, setSceneZones] = useState<FloorSceneZones>(() => ({
    stage: { ...DEFAULT_FLOOR_SCENE_ZONES.stage },
    carpet: { ...DEFAULT_FLOOR_SCENE_ZONES.carpet },
  }));
  const [serverPalette, setServerPalette] = useState<FloorLayoutPalette>(EMPTY_PALETTE);
  const [hasLegacyItems, setHasLegacyItems] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reservedLayoutItemIds, setReservedLayoutItemIds] = useState<string[]>([]);
  const [newlyReservedLayoutItemIds, setNewlyReservedLayoutItemIds] = useState<string[]>([]);

  const palette = useMemo((): FloorLayoutPalette => {
    const placedTableIds = new Set(
      items
        .filter((i): i is Extract<PlacedLayoutItem, { kind: "catalog_table" }> => i.kind === "catalog_table")
        .map((i) => i.venueTableConfigId),
    );
    const placedChairIds = new Set(
      items
        .filter(
          (i): i is Extract<PlacedLayoutItem, { kind: "standalone_chair" }> =>
            i.kind === "standalone_chair",
        )
        .map((i) => i.venueStandaloneChairId),
    );
    const placedChairCount = placedChairIds.size;

    const unplacedTables = serverPalette.unplacedTables.filter(
      (t) => !placedTableIds.has(t.id),
    );
    const unplacedChairs = serverPalette.unplacedChairs.filter(
      (c) => !placedChairIds.has(c.id),
    );

    const tablesBySize: Record<VenueTableSize, number> = {
      LARGE: 0,
      MEDIUM: 0,
      SMALL: 0,
    };
    for (const t of unplacedTables) {
      tablesBySize[t.size] += 1;
    }

    return {
      tablesBySize,
      standaloneChairsAvailable: unplacedChairs.length,
      unplacedTables,
      unplacedChairs,
      placedTableIds: [...placedTableIds],
      placedChairIds: [...placedChairIds],
      placedChairCount,
    };
  }, [items, serverPalette]);

  const applyLayout = useCallback((layout: VenueFloorLayout) => {
    setLayoutMeta({
      id: layout.id,
      viewBoxWidth: layout.viewBoxWidth,
      viewBoxHeight: layout.viewBoxHeight,
      backgroundVersion: layout.backgroundVersion,
    });
    setItems(layout.items);
    setSceneZones({
      stage: { ...layout.sceneZones.stage },
      carpet: { ...layout.sceneZones.carpet },
    });
    setHasLegacyItems(layout.hasLegacyItems === true);
    setSelectedId(null);
  }, []);

  const load = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) {
      setError("Not signed in.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [layoutResult, paletteResult] = await Promise.all([
        fetchAdminFloorLayout(token),
        fetchAdminFloorLayoutPalette(token),
      ]);
      if (!layoutResult.ok) {
        const msg = nestApiErrorMessage(
          layoutResult.data,
          layoutResult.status === 401
            ? "Invalid or expired token."
            : "Could not load floor layout.",
        );
        setError(msg);
        return;
      }
      const layout = layoutResult.layout;
      if (!layout) {
        setError("Invalid layout response.");
        return;
      }
      applyLayout(layout);
      if (paletteResult.ok && paletteResult.palette) {
        setServerPalette(paletteResult.palette);
      }
      const previousSeenAt = readLastSeenPaidReservationAtMs();
      const paidReservationsResult = await fetchAdminVenueReservations(token, {
        status: "PAID",
        page: 1,
        perPage: 50,
      });
      if (paidReservationsResult.ok) {
        const uniqueReservedIds = [
          ...new Set(
            paidReservationsResult.reservations
              .map((row) => row.layoutItemId)
              .filter((id) => id.trim().length > 0),
          ),
        ];
        const newIds = [
          ...new Set(
            paidReservationsResult.reservations
              .filter((row) => {
                const createdAtMs = Date.parse(row.createdAt);
                return Number.isFinite(createdAtMs) && createdAtMs > previousSeenAt;
              })
              .map((row) => row.layoutItemId)
              .filter((id) => id.trim().length > 0),
          ),
        ];
        const latestPaidAt = paidReservationsResult.reservations.reduce((max, row) => {
          const createdAtMs = Date.parse(row.createdAt);
          return Number.isFinite(createdAtMs) ? Math.max(max, createdAtMs) : max;
        }, 0);
        setReservedLayoutItemIds(uniqueReservedIds);
        setNewlyReservedLayoutItemIds(newIds);
        if (latestPaidAt > 0) {
          writeLastSeenPaidReservationAtMs(latestPaidAt);
          notifyOnComingEventsBadgeRefresh();
        }
      } else {
        setReservedLayoutItemIds([]);
        setNewlyReservedLayoutItemIds([]);
      }
      setDirty(false);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [applyLayout]);

  useEffect(() => {
    if (newlyReservedLayoutItemIds.length === 0) return;
    const timeoutId = window.setTimeout(() => {
      setNewlyReservedLayoutItemIds([]);
    }, 9000);
    return () => window.clearTimeout(timeoutId);
  }, [newlyReservedLayoutItemIds]);

  useEffect(() => {
    void load();
  }, [load]);

  const addCatalogTable = useCallback(
    (size: VenueTableSize, x: number, y: number) => {
      const placedIds = new Set(
        items
          .filter((i): i is Extract<PlacedLayoutItem, { kind: "catalog_table" }> => i.kind === "catalog_table")
          .map((i) => i.venueTableConfigId),
      );
      const table = serverPalette.unplacedTables.find(
        (t) => t.size === size && !placedIds.has(t.id),
      );
      if (!table) {
        toast({
          variant: "destructive",
          title: "No tables available",
          description: `No unplaced ${size.toLowerCase()} tables in inventory.`,
        });
        return;
      }
      const item: PlacedLayoutItem = {
        id: crypto.randomUUID(),
        kind: "catalog_table",
        venueTableConfigId: table.id,
        tableName: TABLE_SIZE_LABELS[table.size],
        size: table.size,
        includedChairs: table.includedChairs,
        x,
        y,
        rotation: 0,
      };
      setItems((prev) => [...prev, item]);
      setSelectedId(item.id);
      setDirty(true);
    },
    [items, serverPalette.unplacedTables],
  );

  const addStandaloneChair = useCallback(
    (x: number, y: number) => {
      const placedIds = new Set(
        items
          .filter(
            (i): i is Extract<PlacedLayoutItem, { kind: "standalone_chair" }> =>
              i.kind === "standalone_chair",
          )
          .map((i) => i.venueStandaloneChairId),
      );
      const chair = serverPalette.unplacedChairs.find((c) => !placedIds.has(c.id));
      if (!chair) {
        toast({
          variant: "destructive",
          title: "No chairs available",
          description: "Configure standalone chair quantity in Table seating.",
        });
        return;
      }
      const item: PlacedLayoutItem = {
        id: crypto.randomUUID(),
        kind: "standalone_chair",
        venueStandaloneChairId: chair.id,
        chairName: chair.displayLabel,
        x,
        y,
        rotation: 0,
      };
      setItems((prev) => [...prev, item]);
      setSelectedId(item.id);
      setDirty(true);
    },
    [items, serverPalette.unplacedChairs],
  );

  const moveItem = useCallback((id: string, x: number, y: number) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, x, y } : item)),
    );
    setDirty(true);
  }, []);

  const updateRotation = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        let rotation = item.rotation + delta;
        if (rotation > 180) rotation -= 360;
        if (rotation < -180) rotation += 360;
        return { ...item, rotation };
      }),
    );
    setDirty(true);
  }, []);

  const updateSceneRotation = useCallback((delta: number) => {
    if (!selectedId || !isSceneSelectId(selectedId)) return;
    const kind = selectedId === SCENE_STAGE_SELECT_ID ? "stage" : "carpet";
    setSceneZones((prev) => {
      const zone = prev[kind];
      let rotationY = zone.rotationY + delta;
      const twoPi = Math.PI * 2;
      if (rotationY > Math.PI) rotationY -= twoPi;
      if (rotationY < -Math.PI) rotationY += twoPi;
      return { ...prev, [kind]: { ...zone, rotationY } };
    });
    setDirty(true);
  }, [selectedId]);

  const moveSceneZone = useCallback((kind: "stage" | "carpet", x: number, z: number) => {
    setSceneZones((prev) => ({
      ...prev,
      [kind]: { ...prev[kind], x, z },
    }));
    setDirty(true);
  }, []);

  const rotateSelected = useCallback(
    (deltaDegrees: number) => {
      if (!selectedId) return;
      if (isSceneSelectId(selectedId)) {
        updateSceneRotation((deltaDegrees * Math.PI) / 180);
        return;
      }
      updateRotation(selectedId, deltaDegrees);
    },
    [selectedId, updateRotation, updateSceneRotation],
  );

  const removeSelected = useCallback(() => {
    if (!selectedId || isSceneSelectId(selectedId)) return;
    setItems((prev) => prev.filter((item) => item.id !== selectedId));
    setSelectedId(null);
    setDirty(true);
  }, [selectedId]);

  const clearAllItems = useCallback(() => {
    setItems([]);
    setSelectedId(null);
    setDirty(true);
  }, []);

  const onReservedItemSelect = useCallback(
    (layoutItemId: string) => {
      router.push(
        `${VENUE_RESERVATIONS_ADMIN_PATH}?layoutItemId=${encodeURIComponent(layoutItemId)}&status=PAID`,
      );
    },
    [router],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || over.id !== FLOOR_CANVAS_DROPPABLE_ID) return;

      const translated = active.rect.current.translated;
      const canvas = sceneHandleRef.current?.getCanvas() ?? null;
      const camera = sceneHandleRef.current?.getCamera() ?? null;
      if (!translated || !canvas || !camera) return;

      const clientX = translated.left + translated.width / 2;
      const clientY = translated.top + translated.height / 2;
      const picked = pickFloorFromClient(
        clientX,
        clientY,
        canvas,
        camera,
        layoutMeta.viewBoxWidth,
        layoutMeta.viewBoxHeight,
      );
      if (!picked) return;
      const { x, y } = picked;

      const source = active.data.current?.source as DragSource | undefined;
      if (source === "palette") {
        const drag = active.data.current?.paletteDrag as PaletteDragKind | undefined;
        if (drag?.type === "table") {
          addCatalogTable(drag.size, x, y);
        } else if (drag?.type === "chair") {
          addStandaloneChair(x, y);
        }
      }
    },
    [
      addCatalogTable,
      addStandaloneChair,
      layoutMeta.viewBoxWidth,
      layoutMeta.viewBoxHeight,
    ],
  );

  const save = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) {
      toast({ variant: "destructive", title: "Not signed in" });
      return;
    }
    setSaving(true);
    try {
      const result = await putAdminFloorLayout(token, {
        viewBoxWidth: layoutMeta.viewBoxWidth,
        viewBoxHeight: layoutMeta.viewBoxHeight,
        backgroundVersion: layoutMeta.backgroundVersion,
        items,
        sceneZones,
      });
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Save failed",
          description: nestApiErrorMessage(result.data, "Could not save layout."),
        });
        return;
      }
      if (result.layout) {
        applyLayout(result.layout);
      }
      const paletteResult = await fetchAdminFloorLayoutPalette(token);
      if (paletteResult.ok && paletteResult.palette) {
        setServerPalette(paletteResult.palette);
      }
      setDirty(false);
      setHasLegacyItems(false);
      toast({ title: "Layout saved" });
    } catch {
      toast({
        variant: "destructive",
        title: "Offline",
        description: "Could not reach the server.",
      });
    } finally {
      setSaving(false);
    }
  }, [items, layoutMeta, sceneZones]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        removeSelected();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [removeSelected]);

  return {
    sceneHandleRef,
    layoutMeta,
    items,
    sceneZones,
    palette,
    hasLegacyItems,
    selectedId,
    setSelectedId,
    dirty,
    loading,
    saving,
    error,
    reservedLayoutItemIds,
    newlyReservedLayoutItemIds,
    chairTotal: totalChairs(items),
    load,
    moveItem,
    moveSceneZone,
    updateRotation,
    rotateSelected,
    removeSelected,
    clearAllItems,
    handleDragEnd,
    save,
    onReservedItemSelect,
  };
}
