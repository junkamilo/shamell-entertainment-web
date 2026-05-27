"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import VenueSceneLegend from "@/components/venue-3d/VenueSceneLegend";
import { useVenueSceneLayout } from "@/components/venue-3d/useVenueSceneLayout";
import type { VenueTableConfig } from "@/app/shamell-admin/venue-tables/types/venueTables.types";
import type { StandaloneChairConfig } from "@/app/shamell-admin/venue-tables/types/standaloneChairs.types";
import type { VenueFloorLayout } from "@/components/floor-layout/layoutTypes";
import { placedSummaryFromItems } from "../lib/placedSummaryFromItems";
import { fetchPublicFloorLayout } from "../services/fetchPublicFloorLayout";
import { fetchPublicStandaloneChairs } from "../services/fetchPublicStandaloneChairs";
import { fetchPublicVenueTables } from "../services/fetchPublicVenueTables";
import { fetchVenueLayoutSettings } from "../services/fetchVenueLayoutSettings";
import {
  fetchVenueReservationAvailability,
  salesClosedMessage,
  type SalesClosedReason,
} from "../services/fetchVenueReservationAvailability";
import VenueLayoutItemModal from "./VenueLayoutItemModal";

const VenueScene3D = dynamic(() => import("@/components/venue-3d/VenueScene3D"), {
  ssr: false,
  loading: () => (
    <div
      className="flex w-full items-center justify-center rounded-xl border border-shamell-line-soft bg-shamell-twilight text-sm text-shamell-muted"
      style={{
        height: "clamp(280px, calc(100dvh - var(--venue-chrome, 14rem)), 860px)",
      }}
    >
      Loading 3D venue…
    </div>
  ),
});

function formatEventHeader(label: string | null, eventDateIso: string | null): string | null {
  if (label?.trim()) return label.trim();
  if (!eventDateIso) return null;
  try {
    return new Date(eventDateIso).toLocaleString(undefined, {
      dateStyle: "long",
      timeStyle: "short",
    });
  } catch {
    return null;
  }
}

export default function VenueLayoutPublicPage() {
  const sceneLayout = useVenueSceneLayout("public");
  const [layout, setLayout] = useState<VenueFloorLayout | null>(null);
  const [tables, setTables] = useState<VenueTableConfig[]>([]);
  const [standaloneChairs, setStandaloneChairs] = useState<StandaloneChairConfig | null>(null);
  const [pageTitle, setPageTitle] = useState("Venue floor plan");
  const [eventLabel, setEventLabel] = useState<string | null>(null);
  const [eventDateIso, setEventDateIso] = useState<string | null>(null);
  const [reservationsOpen, setReservationsOpen] = useState(false);
  const [salesClosedReason, setSalesClosedReason] = useState<SalesClosedReason | null>(null);
  const [clientEnabled, setClientEnabled] = useState<boolean | null>(null);
  const [reservedLayoutItemIds, setReservedLayoutItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const placedSummary = useMemo(
    () => (layout ? placedSummaryFromItems(layout.items) : null),
    [layout],
  );

  const tablesById = useMemo(() => new Map(tables.map((t) => [t.id, t])), [tables]);

  const reservedIds = useMemo(() => new Set(reservedLayoutItemIds), [reservedLayoutItemIds]);

  const selectedItem = useMemo(() => {
    if (!selectedItemId || !layout) return null;
    return layout.items.find((i) => i.id === selectedItemId) ?? null;
  }, [layout, selectedItemId]);

  const selectedTableConfig = useMemo(() => {
    if (!selectedItem || selectedItem.kind !== "catalog_table") return null;
    return tablesById.get(selectedItem.venueTableConfigId) ?? null;
  }, [selectedItem, tablesById]);

  const selectedIsReserved = selectedItemId ? reservedIds.has(selectedItemId) : false;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await fetchVenueLayoutSettings();
      if (!settings?.clientEnabled) {
        setClientEnabled(false);
        setLoading(false);
        return;
      }
      setClientEnabled(true);
      if (settings.promoTitle?.trim()) {
        setPageTitle(settings.promoTitle.trim());
      }
      setEventLabel(settings.reservationEventLabel ?? null);
      setEventDateIso(
        settings.reservationOpensAt ?? settings.reservationEventDate ?? null,
      );

      const [layoutData, tablesData, chairsData, availability] = await Promise.all([
        fetchPublicFloorLayout(),
        fetchPublicVenueTables(),
        fetchPublicStandaloneChairs(),
        fetchVenueReservationAvailability(),
      ]);

      if (!layoutData) {
        setError("Floor plan is not available.");
        return;
      }
      setLayout(layoutData);
      setTables(tablesData);
      setStandaloneChairs(chairsData);
      setReservedLayoutItemIds(availability.reservedLayoutItemIds);
      setReservationsOpen(availability.reservationsOpen);
      setSalesClosedReason(availability.salesClosedReason);
      if (availability.eventDate) {
        setEventDateIso(availability.eventDate);
      }
    } catch {
      setError("Could not load floor plan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleItemSelect = useCallback(
    (id: string) => {
      if (reservedIds.has(id)) {
        setSelectedItemId(id);
        return;
      }
      setSelectedItemId(id);
    },
    [reservedIds],
  );

  const eventHeader = formatEventHeader(eventLabel, eventDateIso);

  if (loading) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-28 text-center text-shamell-muted">
          Loading floor plan…
        </main>
        <Footer />
      </>
    );
  }

  if (clientEnabled === false) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-28 text-center">
          <h1 className="font-display text-2xl text-shamell-gold">Venue layout unavailable</h1>
          <p className="mt-3 text-sm text-shamell-muted">
            The interactive floor plan is not published at this time.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm text-shamell-gold underline-offset-2 hover:underline"
          >
            Return home
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !layout || !standaloneChairs) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-28 text-center text-shamell-danger">
          {error ?? "Floor plan unavailable."}
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main
        className="mx-auto w-full max-w-[min(100%,1920px)] px-2 pb-16 pt-20 sm:px-4 sm:pt-24 md:px-6 lg:px-10 min-[1920px]:max-w-[min(100%,2400px)]"
        style={{ ["--venue-chrome" as string]: sceneLayout.chromeCss }}
      >
        <header className="mb-4 text-center sm:mb-6 md:mb-8">
          <h1 className="font-display text-2xl text-shamell-gold sm:text-3xl md:text-4xl">
            {pageTitle}
          </h1>
          {eventHeader ? (
            <p className="mt-2 text-sm font-medium text-shamell-gold/90 md:text-base">{eventHeader}</p>
          ) : null}
          <p className="mx-auto mt-2 max-w-2xl text-sm text-shamell-muted md:text-base">
            <span className="sm:hidden">
              Tap a table or chair to reserve · pinch to zoom · two fingers to pan
            </span>
            <span className="hidden sm:inline">
              Click an available table or chair to reserve. Drag to rotate the view. Total capacity:{" "}
              {layout.totalChairs} chairs.
            </span>
          </p>
          <p className="mx-auto mt-1 max-w-2xl text-xs text-shamell-muted/80 sm:hidden">
            Capacity: {layout.totalChairs} chairs
          </p>
          {!reservationsOpen && salesClosedReason ? (
            <p className="mx-auto mt-3 max-w-xl rounded-lg border border-amber-500/25 bg-amber-950/25 px-4 py-2 text-sm text-amber-100">
              {salesClosedMessage(salesClosedReason)}
            </p>
          ) : null}
        </header>
        <div className="relative w-full overflow-hidden rounded-lg border border-shamell-line-soft bg-[#1a1218] shadow-[0_24px_64px_rgba(0,0,0,0.45)] sm:rounded-xl">
          <VenueScene3D
            mode="public-select"
            viewBoxWidth={layout.viewBoxWidth}
            viewBoxHeight={layout.viewBoxHeight}
            items={layout.items}
            selectedId={selectedItemId}
            reservedIds={reservedIds}
            onItemSelect={handleItemSelect}
            viewportHeight={sceneLayout.viewportHeight}
            viewportMinHeight={sceneLayout.viewportMinHeight}
            layoutBucket={sceneLayout.bucket}
            dpr={sceneLayout.dpr}
          />
          {placedSummary ? (
            <VenueSceneLegend
              placedSummary={placedSummary}
              showReservationKey
              layoutTopOnNarrow={sceneLayout.isPhone || sceneLayout.isTablet}
            />
          ) : null}
        </div>
      </main>
      <Footer />

      {selectedItem ? (
        <VenueLayoutItemModal
          item={selectedItem}
          tableConfig={selectedTableConfig}
          standaloneChairs={standaloneChairs}
          eventLabel={eventLabel}
          eventDateIso={eventDateIso}
          isReserved={selectedIsReserved}
          reservationsOpen={reservationsOpen}
          reservationsClosedMessage={salesClosedMessage(salesClosedReason)}
          onClose={() => setSelectedItemId(null)}
        />
      ) : null}
    </>
  );
}
