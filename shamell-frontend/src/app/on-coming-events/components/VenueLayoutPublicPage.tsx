"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import VenueSceneLegend from "@/components/venue-3d/VenueSceneLegend";
import { useVenueSceneLayout } from "@/components/venue-3d/useVenueSceneLayout";
import bailarinaLogo from "@/public/01_bailarina.png";
import type { VenueTableConfig } from "@/app/shamell-admin/venue-tables/types/venueTables.types";
import type { StandaloneChairConfig } from "@/app/shamell-admin/venue-tables/types/standaloneChairs.types";
import type { VenueFloorLayout } from "@/components/floor-layout/layoutTypes";
import { placedSummaryFromItems } from "../lib/placedSummaryFromItems";
import { buildStandaloneChairPriceMap } from "../lib/resolveStandaloneChairUnitPrice";
import { fetchPublicFloorLayout } from "../services/fetchPublicFloorLayout";
import { fetchPublicStandaloneChairs } from "../services/fetchPublicStandaloneChairs";
import { fetchPublicVenueTables } from "../services/fetchPublicVenueTables";
import { fetchOnComingEventsSettings } from "../services/fetchVenueLayoutSettings";
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

type Props = { eventSlug?: string };

export default function VenueLayoutPublicPage({ eventSlug }: Props) {
  const sceneLayout = useVenueSceneLayout("public");
  const [layout, setLayout] = useState<VenueFloorLayout | null>(null);
  const [tables, setTables] = useState<VenueTableConfig[]>([]);
  const [standaloneChairs, setStandaloneChairs] = useState<StandaloneChairConfig | null>(null);
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

  const chairPricesById = useMemo(
    () => buildStandaloneChairPriceMap(standaloneChairs?.chairs),
    [standaloneChairs?.chairs],
  );

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
      const apiBase = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(
        /\/$/,
        "",
      );

      if (!eventSlug) {
        const settings = await fetchOnComingEventsSettings();
        if (!settings?.clientEnabled) {
          setClientEnabled(false);
          setLoading(false);
          return;
        }
        setClientEnabled(true);
        setEventLabel(settings.reservationEventLabel ?? null);
        setEventDateIso(
          settings.reservationOpensAt ?? settings.reservationEventDate ?? null,
        );
      } else {
        const venueRes = await fetch(
          `${apiBase}/api/v1/upcoming-events/${encodeURIComponent(eventSlug)}/venue`,
        ).catch(() => null);
        if (!venueRes?.ok) {
          setClientEnabled(false);
          setLoading(false);
          return;
        }
        const venueData = (await venueRes.json()) as {
          event?: { eventTypeName?: string };
          config?: { reservationEventLabel?: string | null; reservationOpensAt?: string | null };
        };
        setClientEnabled(true);
        setEventLabel(
          venueData.config?.reservationEventLabel ??
            venueData.event?.eventTypeName ??
            null,
        );
        setEventDateIso(venueData.config?.reservationOpensAt ?? null);
      }

      const [layoutData, tablesData, chairsData, availability] = await Promise.all([
        fetchPublicFloorLayout(),
        fetchPublicVenueTables(),
        fetchPublicStandaloneChairs(),
        fetchVenueReservationAvailability(eventSlug),
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
  }, [eventSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const refreshPrices = () => void load();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refreshPrices();
    };
    window.addEventListener("focus", refreshPrices);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", refreshPrices);
      document.removeEventListener("visibilitychange", onVisibility);
    };
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
          <h1 className="font-display text-2xl text-shamell-gold">On Coming Events unavailable</h1>
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
        className="mx-auto w-full max-w-[min(100%,1920px)] px-2 pb-16 pt-18 sm:px-4 sm:pt-22 md:px-6 lg:px-10 min-[1920px]:max-w-[min(100%,2400px)]"
        style={{ ["--venue-chrome" as string]: sceneLayout.chromeCss }}
      >
        <header className="mb-8 px-0 pt-2 text-center sm:mb-10 sm:pt-4 md:mb-12">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center sm:mb-8 sm:h-24 sm:w-24">
            <Image
              src={bailarinaLogo}
              alt="Shamell logo"
              priority
              className="h-full w-auto object-contain drop-shadow-[0_0_18px_rgba(197,165,90,0.2)]"
            />
          </div>
          <p className="mb-3 font-brand text-xs uppercase tracking-[0.28em] text-[#c5a059]/90">
            Begin your Shamell experience
          </p>
          <h1 className="mx-auto max-w-5xl font-brand text-3xl uppercase tracking-[0.14em] text-gold md:text-5xl">
            <span className="block leading-tight">On Coming</span>
            <span className="mt-1 block leading-tight md:mt-1.5">Events</span>
          </h1>
          <p className="mx-auto mt-5 max-w-3xl font-elegant text-lg leading-relaxed text-[#d1d1d1]/95 md:mt-6 md:text-xl">
            Every celebration is different. Reserve your table or chair for your next event, or
            let Shamell&apos;s team guide the best seat selection for your experience.
          </p>
        </header>
        <div className="relative w-full overflow-hidden rounded-lg border border-shamell-line-soft bg-[#1a1218] shadow-[0_24px_64px_rgba(0,0,0,0.45)] sm:rounded-xl">
          <VenueScene3D
            mode="public-select"
            viewBoxWidth={layout.viewBoxWidth}
            viewBoxHeight={layout.viewBoxHeight}
            items={layout.items}
            sceneZones={layout.sceneZones}
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
          chairPricesById={chairPricesById}
          eventLabel={eventLabel}
          eventDateIso={eventDateIso}
          isReserved={selectedIsReserved}
          reservationsOpen={reservationsOpen}
          reservationsClosedMessage={salesClosedMessage(salesClosedReason)}
          upcomingEventSlug={eventSlug}
          onClose={() => setSelectedItemId(null)}
        />
      ) : null}
    </>
  );
}
