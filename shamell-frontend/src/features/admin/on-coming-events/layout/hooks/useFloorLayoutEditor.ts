"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import type { VenueScene3DHandle } from "@/components/venue-3d/VenueScene3D";
import { totalChairs } from "../lib/floorLayoutStats";
import { fetchAdminFloorLayout } from "../services/fetchAdminFloorLayout";
import { fetchAdminFloorLayoutPalette } from "../services/fetchAdminFloorLayoutPalette";
import { putAdminFloorLayout } from "../services/putAdminFloorLayout";
import { fetchAdminStandaloneChairs } from "@/features/admin/venue-tables/services/fetchAdminStandaloneChairs";
import { fetchAdminVenueTables } from "@/features/admin/venue-tables/services/fetchAdminVenueTables";
import type { StandaloneChairInventoryItem } from "@/features/admin/venue-tables/types/standaloneChairs.types";
import type { VenueTableConfig } from "@/features/admin/venue-tables/types/venueTables.types";
import { buildLayoutItemLabelMap } from "@/lib/venueSeatDisplayLabel";
import { fetchAdminVenueReservations } from "@/features/admin/venue-reservations/services/fetchAdminVenueReservations";
import { fetchAdminVenueAvailability } from "../services/fetchAdminVenueAvailability";
import { VENUE_RESERVATIONS_ADMIN_PATH } from "@/features/admin/venue-reservations/lib/venueReservationsRoutes";
import {
  notifyOnComingEventsBadgeRefresh,
  readLastSeenPaidReservationAtMs,
  writeLastSeenPaidReservationAtMs,
} from "@/lib/onComingEventsReservationsNotice";
import { carpetZoneFromStage } from "@/components/venue-3d/stage/stageConstants";
import {
  DEFAULT_FLOOR_SCENE_ZONES,
  isSceneSelectId,
  SCENE_STAGE_SELECT_ID,
} from "../lib/floorSceneZones.defaults";
import { facingStageRotationDegrees } from "../lib/facingStageRotation";
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

/** @deprecated SVG canvas droppable id; 3D editor uses pointer drag instead. */
export const FLOOR_CANVAS_DROPPABLE_ID = "floor-canvas";

export type PaletteDragKind =
  | { type: "table"; size: VenueTableSize }
  | { type: "chair" };

export type FloorLayoutEditorMode = "edit" | "reserve";

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
  const [editorMode, setEditorMode] = useState<FloorLayoutEditorMode>("edit");
  const [reservedLayoutItemIds, setReservedLayoutItemIds] = useState<string[]>([]);
  const [reservedVenueTableConfigIds, setReservedVenueTableConfigIds] = useState<
    string[]
  >([]);
  const [reservedSeatShortLabels, setReservedSeatShortLabels] = useState<string[]>(
    [],
  );
  const [pendingLayoutItemIds, setPendingLayoutItemIds] = useState<string[]>([]);
  const [reservedLabelsByLayoutItemId, setReservedLabelsByLayoutItemId] = useState<
    Record<string, string>
  >({});
  const [venueReservationContext, setVenueReservationContext] = useState<{
    eventDateIso: string | null;
    upcomingEventSlug: string | null;
  }>({ eventDateIso: null, upcomingEventSlug: null });
  const [tableBundlePriceByConfigId, setTableBundlePriceByConfigId] = useState<
    Record<string, number>
  >({});
  const [venueTablesCatalog, setVenueTablesCatalog] = useState<VenueTableConfig[]>([]);
  const [standaloneChairsCatalog, setStandaloneChairsCatalog] = useState<
    StandaloneChairInventoryItem[]
  >([]);

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
    const stage = { ...layout.sceneZones.stage };
    setSceneZones({
      stage,
      carpet: carpetZoneFromStage(stage),
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
      const [availabilityResult, tablesResult, chairsResult] = await Promise.all([
        fetchAdminVenueAvailability(token),
        fetchAdminVenueTables(token),
        fetchAdminStandaloneChairs(token),
      ]);

      const previousSeenAt = readLastSeenPaidReservationAtMs();
      if (availabilityResult.ok) {
        const { data } = availabilityResult;
        setVenueReservationContext({
          eventDateIso: data.eventDate || null,
          upcomingEventSlug: data.upcomingEventSlug,
        });
        setReservedLayoutItemIds(data.reservedLayoutItemIds);
        setReservedVenueTableConfigIds(data.reservedVenueTableConfigIds);
        setReservedSeatShortLabels(data.reservedSeatShortLabels);
        setPendingLayoutItemIds(data.pendingLayoutItemIds);
        const labels: Record<string, string> = {};
        for (const row of data.paidSeatHolders) {
          if (!row.layoutItemId.trim()) continue;
          labels[row.layoutItemId] = row.customerName.trim() || "Guest";
        }
        setReservedLabelsByLayoutItemId(labels);

        const paidReservationsResult = await fetchAdminVenueReservations(token, {
          status: "PAID",
          page: 1,
          perPage: 50,
        });
        if (paidReservationsResult.ok) {
          const latestPaidAt = paidReservationsResult.reservations.reduce((max, row) => {
            const createdAtMs = Date.parse(row.createdAt);
            return Number.isFinite(createdAtMs) ? Math.max(max, createdAtMs) : max;
          }, 0);
          if (latestPaidAt > previousSeenAt) {
            writeLastSeenPaidReservationAtMs(latestPaidAt);
            notifyOnComingEventsBadgeRefresh();
          }
        }
      } else {
        setReservedLayoutItemIds([]);
        setReservedVenueTableConfigIds([]);
        setReservedSeatShortLabels([]);
        setPendingLayoutItemIds([]);
        setReservedLabelsByLayoutItemId({});
        setVenueReservationContext({ eventDateIso: null, upcomingEventSlug: null });
      }

      if (tablesResult.ok) {
        setVenueTablesCatalog(tablesResult.items);
        const prices: Record<string, number> = {};
        for (const table of tablesResult.items) {
          prices[table.id] = table.bundlePrice;
        }
        setTableBundlePriceByConfigId(prices);
      } else {
        setVenueTablesCatalog([]);
        setTableBundlePriceByConfigId({});
      }

      if (chairsResult.ok && chairsResult.config?.chairs) {
        setStandaloneChairsCatalog(chairsResult.config.chairs);
      } else {
        setStandaloneChairsCatalog([]);
      }
      setDirty(false);
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  }, [applyLayout]);

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
        rotation: facingStageRotationDegrees(
          x,
          y,
          layoutMeta.viewBoxWidth,
          layoutMeta.viewBoxHeight,
          sceneZones.stage.x,
          sceneZones.stage.z,
        ),
      };
      setItems((prev) => [...prev, item]);
      setSelectedId(item.id);
      setDirty(true);
    },
    [
      items,
      layoutMeta.viewBoxHeight,
      layoutMeta.viewBoxWidth,
      sceneZones.stage.x,
      sceneZones.stage.z,
      serverPalette.unplacedChairs,
    ],
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
    if (selectedId !== SCENE_STAGE_SELECT_ID) return;
    setSceneZones((prev) => {
      const zone = prev.stage;
      let rotationY = zone.rotationY + delta;
      const twoPi = Math.PI * 2;
      if (rotationY > Math.PI) rotationY -= twoPi;
      if (rotationY < -Math.PI) rotationY += twoPi;
      const stage = { ...zone, rotationY };
      return {
        ...prev,
        stage,
        carpet: carpetZoneFromStage(stage),
      };
    });
    setDirty(true);
  }, [selectedId]);

  const moveStage = useCallback((x: number, z: number) => {
    setSceneZones((prev) => {
      const stage = { ...prev.stage, x, z };
      return { stage, carpet: carpetZoneFromStage(stage) };
    });
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

  const applyCashReservation = useCallback((layoutItemId: string, customerName: string) => {
    setReservedLayoutItemIds((prev) =>
      prev.includes(layoutItemId) ? prev : [...prev, layoutItemId],
    );
    setReservedLabelsByLayoutItemId((prev) => ({
      ...prev,
      [layoutItemId]: customerName.trim() || "Guest",
    }));
    setPendingLayoutItemIds((prev) => prev.filter((id) => id !== layoutItemId));
    notifyOnComingEventsBadgeRefresh();
  }, []);

  const handlePlacedItemSelect = useCallback(
    (layoutItemId: string | null) => {
      if (editorMode !== "reserve" || !layoutItemId) {
        setSelectedId(layoutItemId);
        return;
      }
      if (reservedLayoutItemIds.includes(layoutItemId)) {
        onReservedItemSelect(layoutItemId);
        return;
      }
      if (pendingLayoutItemIds.includes(layoutItemId)) {
        toast({
          title: "Seat pending payment",
          description: "This seat has a pending Stripe payment link.",
        });
        return;
      }
      setSelectedId(layoutItemId);
    },
    [
      editorMode,
      onReservedItemSelect,
      pendingLayoutItemIds,
      reservedLayoutItemIds,
    ],
  );

  const placePaletteItem = useCallback(
    (drag: PaletteDragKind, x: number, y: number) => {
      if (drag.type === "table") {
        addCatalogTable(drag.size, x, y);
      } else {
        addStandaloneChair(x, y);
      }
    },
    [addCatalogTable, addStandaloneChair],
  );

  const placePaletteItemAtCenter = useCallback(
    (drag: PaletteDragKind) => {
      placePaletteItem(drag, layoutMeta.viewBoxWidth / 2, layoutMeta.viewBoxHeight / 2);
    },
    [placePaletteItem, layoutMeta.viewBoxWidth, layoutMeta.viewBoxHeight],
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
        sceneZones: {
          stage: sceneZones.stage,
          carpet: carpetZoneFromStage(sceneZones.stage),
        },
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

  const itemLabels = useMemo(
    () => buildLayoutItemLabelMap(items, venueTablesCatalog, standaloneChairsCatalog),
    [items, venueTablesCatalog, standaloneChairsCatalog],
  );

  return {
    sceneHandleRef,
    layoutMeta,
    items,
    sceneZones,
    palette,
    hasLegacyItems,
    editorMode,
    setEditorMode,
    selectedId,
    setSelectedId,
    dirty,
    loading,
    saving,
    error,
    reservedLayoutItemIds,
    reservedVenueTableConfigIds,
    reservedSeatShortLabels,
    pendingLayoutItemIds,
    reservedLabelsByLayoutItemId,
    eventDateIso: venueReservationContext.eventDateIso,
    upcomingEventSlug: venueReservationContext.upcomingEventSlug,
    tableBundlePriceByConfigId,
    itemLabels,
    chairTotal: totalChairs(items),
    load,
    moveItem,
    moveStage,
    updateRotation,
    rotateSelected,
    removeSelected,
    clearAllItems,
    placePaletteItem,
    placePaletteItemAtCenter,
    save,
    onReservedItemSelect,
    handlePlacedItemSelect,
    applyCashReservation,
  };
}
