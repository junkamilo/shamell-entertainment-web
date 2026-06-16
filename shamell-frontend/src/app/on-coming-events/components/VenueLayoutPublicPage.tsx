"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Footer from "@/components/Footer";
import { FixedTicketInventoryDisplay } from "@/components/shared/FixedTicketInventoryDisplay";
import ShamellBusyOverlay from "@/components/shared/ShamellBusyOverlay";
import {
  isFutureEventStart,
  ShamellCountdown,
} from "@/components/shared/ShamellCountdown";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import {
  onComingEventDetailHref,
  onComingEventHubHref,
} from "@/lib/upcomingEventPublicRoutes";
import VenueSceneLegend from "@/components/venue-3d/VenueSceneLegend";
import { useVenueSceneLayout } from "@/components/venue-3d/useVenueSceneLayout";
import type { VenueTableConfig } from "@/app/shamell-admin/venue-tables/types/venueTables.types";
import type { StandaloneChairConfig } from "@/app/shamell-admin/venue-tables/types/standaloneChairs.types";
import type { VenueFloorLayout } from "@/components/floor-layout/layoutTypes";
import {
  getVenueLayoutPageCache,
  patchVenueLayoutPageAvailability,
  setVenueLayoutPageCache,
  type VenueLayoutPageCacheEntry,
} from "../lib/venueLayoutPageCache";
import { buildReservedLayoutItemIdSet } from "@/lib/venueLayoutReservedIds";
import { buildLayoutItemLabelMap } from "@/lib/venueSeatDisplayLabel";
import { placedSummaryFromItems } from "../lib/placedSummaryFromItems";
import { buildStandaloneChairPriceMap } from "../lib/resolveStandaloneChairUnitPrice";
import { fetchPublicFloorLayout } from "../services/fetchPublicFloorLayout";
import { fetchPublicStandaloneChairs } from "../services/fetchPublicStandaloneChairs";
import { fetchPublicVenueTables } from "../services/fetchPublicVenueTables";
import { fetchOnComingEventDetail } from "../services/fetchOnComingEventDetail";
import { fetchOnComingEventsSettings } from "../services/fetchVenueLayoutSettings";
import {
  fetchVenueReservationAvailability,
  salesClosedMessage,
  type SalesClosedReason,
} from "../services/fetchVenueReservationAvailability";
import { OnComingEventHeroSection } from "./OnComingEventHeroSection";
import { OnComingEventItemsSection } from "./OnComingEventItemsSection";
import VenueLayoutItemModal from "./VenueLayoutItemModal";

const VenueScene3D = dynamic(() => import("@/components/venue-3d/VenueScene3D"), {
  ssr: false,
  loading: () => (
    <div
      className="flex w-full items-center justify-center rounded-xl border border-shamell-line-soft bg-shamell-twilight text-sm text-shamell-muted"
      style={{
        height: "clamp(280px, calc(100dvh - var(--venue-chrome, 14rem)), 860px)",
      }}
      aria-hidden
    />
  ),
});

type Props = { eventSlug?: string };

const loadInFlight = new Map<string, Promise<void>>();

function cacheKeyFor(eventSlug?: string) {
  return eventSlug ?? "__legacy__";
}

function stateFromCache(entry: VenueLayoutPageCacheEntry) {
  return {
    layout: entry.layout,
    tables: entry.tables,
    standaloneChairs: entry.standaloneChairs,
    clientEnabled: entry.clientEnabled,
    eventLabel: entry.eventLabel,
    eventTitle: entry.eventTitle,
    eventDescription: entry.eventDescription,
    eventItems: entry.eventItems,
    heroImageUrl: entry.heroImageUrl,
    heroMediaType: entry.heroMediaType,
    eventPrice: entry.eventPrice,
    eventStartsAt: entry.eventStartsAt,
    tableCapacity: entry.tableCapacity,
    tablesRemaining: entry.tablesRemaining,
    tablesSold: entry.tablesSold,
    eventDateIso: entry.eventDateIso,
    reservationsOpen: entry.reservationsOpen,
    salesClosedReason: entry.salesClosedReason,
    reservedLayoutItemIds: entry.reservedLayoutItemIds,
    reservedVenueTableConfigIds: entry.reservedVenueTableConfigIds ?? [],
    reservedSeatShortLabels: entry.reservedSeatShortLabels ?? [],
    paidSeatHolders: entry.paidSeatHolders,
  };
}

export default function VenueLayoutPublicPage({ eventSlug }: Props) {
  const sceneLayout = useVenueSceneLayout("public");
  const backFallbackHref = eventSlug
    ? onComingEventDetailHref(eventSlug)
    : onComingEventHubHref();
  const cachedEntry = getVenueLayoutPageCache(eventSlug);
  const cachedState = cachedEntry ? stateFromCache(cachedEntry) : null;

  const [leaving, setLeaving] = useState(false);
  const [layout, setLayout] = useState<VenueFloorLayout | null>(cachedState?.layout ?? null);
  const [tables, setTables] = useState<VenueTableConfig[]>(cachedState?.tables ?? []);
  const [standaloneChairs, setStandaloneChairs] = useState<StandaloneChairConfig | null>(
    cachedState?.standaloneChairs ?? null,
  );
  const [eventLabel, setEventLabel] = useState<string | null>(cachedState?.eventLabel ?? null);
  const [eventTitle, setEventTitle] = useState(cachedState?.eventTitle ?? "On Coming Events");
  const [eventDescription, setEventDescription] = useState(cachedState?.eventDescription ?? "");
  const [eventItems, setEventItems] = useState<string[]>(cachedState?.eventItems ?? []);
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(
    cachedState?.heroImageUrl ?? null,
  );
  const [heroMediaType, setHeroMediaType] = useState<"IMAGE" | "VIDEO" | null>(
    cachedState?.heroMediaType ?? null,
  );
  const [eventPrice, setEventPrice] = useState<number | null>(cachedState?.eventPrice ?? null);
  const [eventStartsAt, setEventStartsAt] = useState<string | undefined>(cachedState?.eventStartsAt);
  const [tableCapacity, setTableCapacity] = useState<number | undefined>(cachedState?.tableCapacity);
  const [tablesRemaining, setTablesRemaining] = useState<number | undefined>(
    cachedState?.tablesRemaining,
  );
  const [tablesSold, setTablesSold] = useState<number | undefined>(cachedState?.tablesSold);
  const [eventDateIso, setEventDateIso] = useState<string | null>(cachedState?.eventDateIso ?? null);
  const [reservationsOpen, setReservationsOpen] = useState(cachedState?.reservationsOpen ?? false);
  const [salesClosedReason, setSalesClosedReason] = useState<SalesClosedReason | null>(
    cachedState?.salesClosedReason ?? null,
  );
  const [clientEnabled, setClientEnabled] = useState<boolean | null>(
    cachedState ? cachedState.clientEnabled : null,
  );
  const [reservedLayoutItemIds, setReservedLayoutItemIds] = useState<string[]>(
    cachedState?.reservedLayoutItemIds ?? [],
  );
  const [reservedVenueTableConfigIds, setReservedVenueTableConfigIds] = useState<
    string[]
  >(cachedState?.reservedVenueTableConfigIds ?? []);
  const [reservedSeatShortLabels, setReservedSeatShortLabels] = useState<string[]>(
    cachedState?.reservedSeatShortLabels ?? [],
  );
  const [paidSeatHolders, setPaidSeatHolders] = useState<
    { layoutItemId: string; customerName: string }[]
  >(cachedState?.paidSeatHolders ?? []);
  const [loading, setLoading] = useState(!cachedEntry);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const [sceneVisible, setSceneVisible] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(Boolean(cachedEntry));

  const hydrateFromCache = useCallback((entry: VenueLayoutPageCacheEntry) => {
    const next = stateFromCache(entry);
    setLayout(next.layout);
    setTables(next.tables);
    setStandaloneChairs(next.standaloneChairs);
    setClientEnabled(next.clientEnabled);
    setEventLabel(next.eventLabel);
    setEventTitle(next.eventTitle);
    setEventDescription(next.eventDescription);
    setEventItems(next.eventItems);
    setHeroImageUrl(next.heroImageUrl);
    setHeroMediaType(next.heroMediaType);
    setEventPrice(next.eventPrice);
    setEventStartsAt(next.eventStartsAt);
    setTableCapacity(next.tableCapacity);
    setTablesRemaining(next.tablesRemaining);
    setTablesSold(next.tablesSold);
    setEventDateIso(next.eventDateIso);
    setReservationsOpen(next.reservationsOpen);
    setSalesClosedReason(next.salesClosedReason);
    setReservedLayoutItemIds(next.reservedLayoutItemIds);
    setReservedVenueTableConfigIds(next.reservedVenueTableConfigIds);
    setReservedSeatShortLabels(next.reservedSeatShortLabels);
    setPaidSeatHolders(next.paidSeatHolders);
    setHasLoadedOnce(true);
  }, []);

  const placedSummary = useMemo(
    () => (layout ? placedSummaryFromItems(layout.items) : null),
    [layout],
  );

  useEffect(() => {
    const el = sceneContainerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setSceneVisible((entry?.intersectionRatio ?? 0) > 0);
      },
      { threshold: [0, 0.01, 0.1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [layout]);

  const tablesById = useMemo(() => new Map(tables.map((t) => [t.id, t])), [tables]);

  const chairPricesById = useMemo(
    () => buildStandaloneChairPriceMap(standaloneChairs?.chairs),
    [standaloneChairs?.chairs],
  );

  const itemLabels = useMemo(
    () =>
      buildLayoutItemLabelMap(
        layout?.items ?? [],
        tables,
        standaloneChairs?.chairs ?? [],
      ),
    [layout?.items, tables, standaloneChairs?.chairs],
  );

  const reservedIds = useMemo(
    () =>
      buildReservedLayoutItemIdSet(
        layout?.items ?? [],
        reservedLayoutItemIds,
        reservedVenueTableConfigIds,
        itemLabels,
        reservedSeatShortLabels,
      ),
    [
      layout?.items,
      reservedLayoutItemIds,
      reservedVenueTableConfigIds,
      itemLabels,
      reservedSeatShortLabels,
    ],
  );
  const reservedLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const holder of paidSeatHolders) {
      if (holder.layoutItemId.trim()) {
        map.set(holder.layoutItemId, holder.customerName);
      }
    }
    return map;
  }, [paidSeatHolders]);

  const selectedItem = useMemo(() => {
    if (!selectedItemId || !layout) return null;
    return layout.items.find((i) => i.id === selectedItemId) ?? null;
  }, [layout, selectedItemId]);

  const selectedTableConfig = useMemo(() => {
    if (!selectedItem || selectedItem.kind !== "catalog_table") return null;
    return tablesById.get(selectedItem.venueTableConfigId) ?? null;
  }, [selectedItem, tablesById]);

  const selectedIsReserved = selectedItemId ? reservedIds.has(selectedItemId) : false;

  const showCountdown = isFutureEventStart(eventStartsAt);
  const showTableInventory = tableCapacity != null && tableCapacity >= 1;
  const seatingSoldOut =
    showTableInventory &&
    tablesRemaining === 0 &&
    tableCapacity != null &&
    tableCapacity >= 1;
  const showHeroPrice = eventPrice != null && !Number.isNaN(Number(eventPrice));

  const applyAvailability = useCallback(
    (
      availability: Awaited<ReturnType<typeof fetchVenueReservationAvailability>>,
      eventDetail?: Awaited<ReturnType<typeof fetchOnComingEventDetail>> | null,
    ) => {
      setReservedLayoutItemIds(availability.reservedLayoutItemIds);
      setReservedVenueTableConfigIds(availability.reservedVenueTableConfigIds);
      setReservedSeatShortLabels(availability.reservedSeatShortLabels);
      setPaidSeatHolders(availability.paidSeatHolders);
      setReservationsOpen(availability.reservationsOpen);
      setSalesClosedReason(availability.salesClosedReason);
      if (availability.eventDate) {
        setEventDateIso(availability.eventDate);
      }
      if (eventDetail) {
        setEventStartsAt(eventDetail.eventStartsAt);
        setTableCapacity(eventDetail.tableCapacity);
        setTablesRemaining(eventDetail.tablesRemaining);
        setTablesSold(eventDetail.tablesSold);
      }
      patchVenueLayoutPageAvailability(eventSlug, {
        reservedLayoutItemIds: availability.reservedLayoutItemIds,
        reservedVenueTableConfigIds: availability.reservedVenueTableConfigIds,
        reservedSeatShortLabels: availability.reservedSeatShortLabels,
        paidSeatHolders: availability.paidSeatHolders,
        reservationsOpen: availability.reservationsOpen,
        salesClosedReason: availability.salesClosedReason,
        eventDateIso: availability.eventDate ?? eventDateIso,
        eventStartsAt: eventDetail?.eventStartsAt,
        tableCapacity: eventDetail?.tableCapacity,
        tablesRemaining: eventDetail?.tablesRemaining,
        tablesSold: eventDetail?.tablesSold,
      });
    },
    [eventDateIso, eventSlug],
  );

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      const key = cacheKeyFor(eventSlug);
      const inFlight = loadInFlight.get(key);
      if (inFlight) {
        await inFlight;
        const cached = getVenueLayoutPageCache(eventSlug);
        if (cached) {
          hydrateFromCache(cached);
        }
        setLoading(false);
        return;
      }

      const silent = options?.silent ?? hasLoadedOnce;
      if (!silent) {
        setLoading(true);
      }
      setError(null);

      const run = (async () => {
        try {
          const apiBase = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(
            /\/$/,
            "",
          );

          let nextClientEnabled = true;
          let nextEventLabel: string | null = null;
          let nextEventTitle = "On Coming Events";
          let nextEventDescription = "";
          let nextEventItems: string[] = [];
          let nextHeroImageUrl: string | null = null;
          let nextHeroMediaType: "IMAGE" | "VIDEO" | null = null;
          let nextEventPrice: number | null = null;
          let nextEventDateIso: string | null = null;

          if (!eventSlug) {
            const settings = await fetchOnComingEventsSettings();
            if (!settings?.clientEnabled) {
              nextClientEnabled = false;
              setClientEnabled(false);
              return;
            }
            nextEventLabel = settings.reservationEventLabel ?? null;
            nextEventTitle =
              settings.promoTitle?.trim() ||
              settings.reservationEventLabel?.trim() ||
              "On Coming Events";
            nextEventDescription = settings.promoDescription?.trim() ?? "";
            const promoUrl = settings.promoImageUrl?.trim() || null;
            nextHeroImageUrl = promoUrl;
            nextHeroMediaType = promoUrl
              ? serviceCatalogMediaTypeFromUrl(promoUrl) === "VIDEO"
                ? "VIDEO"
                : "IMAGE"
              : null;
            nextEventDateIso =
              settings.reservationEventDate ?? settings.reservationOpensAt ?? null;
          } else {
            const venueRes = await fetch(
              `${apiBase}/api/v1/upcoming-events/${encodeURIComponent(eventSlug)}/venue`,
            ).catch(() => null);
            if (!venueRes?.ok) {
              nextClientEnabled = false;
              setClientEnabled(false);
              return;
            }
            const venueData = (await venueRes.json()) as {
              event?: {
                eventTypeName?: string;
                description?: string;
                items?: string[];
              };
              config?: {
                reservationEventLabel?: string | null;
                reservationEventDate?: string | null;
                reservationOpensAt?: string | null;
              };
            };
            nextEventLabel =
              venueData.config?.reservationEventLabel ??
              venueData.event?.eventTypeName ??
              null;
            nextEventTitle =
              venueData.event?.eventTypeName?.trim() ||
              venueData.config?.reservationEventLabel?.trim() ||
              "On Coming Events";
            nextEventDescription =
              typeof venueData.event?.description === "string" ? venueData.event.description : "";
            nextEventItems = Array.isArray(venueData.event?.items)
              ? venueData.event.items.filter((item): item is string => typeof item === "string")
              : [];
            nextEventDateIso =
              venueData.config?.reservationEventDate ??
              venueData.config?.reservationOpensAt ??
              null;
          }

          const [layoutData, tablesData, chairsData, availability, eventDetail] =
            await Promise.all([
              fetchPublicFloorLayout(),
              fetchPublicVenueTables(),
              fetchPublicStandaloneChairs(),
              fetchVenueReservationAvailability(eventSlug),
              eventSlug
                ? fetchOnComingEventDetail(eventSlug).catch(() => null)
                : Promise.resolve(null),
            ]);

          if (!layoutData) {
            setError("Floor plan is not available.");
            return;
          }

          if (!chairsData) {
            setError("Floor plan is not available.");
            return;
          }

          setClientEnabled(nextClientEnabled);
          setEventLabel(nextEventLabel);
          setEventTitle(nextEventTitle);
          setEventDescription(nextEventDescription);
          setEventItems(nextEventItems);
          setLayout(layoutData);
          setTables(tablesData);
          setStandaloneChairs(chairsData);
          setReservationsOpen(availability.reservationsOpen);
          setSalesClosedReason(availability.salesClosedReason);
          setReservedLayoutItemIds(availability.reservedLayoutItemIds);
          setReservedVenueTableConfigIds(availability.reservedVenueTableConfigIds);
          setReservedSeatShortLabels(availability.reservedSeatShortLabels);
          setPaidSeatHolders(availability.paidSeatHolders);
          if (availability.eventDate) {
            nextEventDateIso = availability.eventDate;
          }
          setEventDateIso(nextEventDateIso);

          if (eventDetail) {
            nextHeroImageUrl = eventDetail.heroImageUrl ?? null;
            nextHeroMediaType = eventDetail.heroMediaType ?? null;
            nextEventPrice = eventDetail.price ?? null;
            setHeroImageUrl(nextHeroImageUrl);
            setHeroMediaType(nextHeroMediaType);
            setEventPrice(nextEventPrice);
            setEventStartsAt(eventDetail.eventStartsAt);
            setTableCapacity(eventDetail.tableCapacity);
            setTablesRemaining(eventDetail.tablesRemaining);
            setTablesSold(eventDetail.tablesSold);
          } else if (eventSlug) {
            setHeroImageUrl(null);
            setHeroMediaType(null);
            setEventPrice(null);
            setEventStartsAt(undefined);
            setTableCapacity(undefined);
            setTablesRemaining(undefined);
            setTablesSold(undefined);
          } else {
            setHeroImageUrl(nextHeroImageUrl);
            setHeroMediaType(nextHeroMediaType);
            setEventPrice(null);
            setEventStartsAt(undefined);
            setTableCapacity(undefined);
            setTablesRemaining(undefined);
            setTablesSold(undefined);
          }

          setVenueLayoutPageCache(eventSlug, {
            layout: layoutData,
            tables: tablesData,
            standaloneChairs: chairsData,
            clientEnabled: nextClientEnabled,
            eventLabel: nextEventLabel,
            eventTitle: nextEventTitle,
            eventDescription: nextEventDescription,
            eventItems: nextEventItems,
            heroImageUrl: eventDetail?.heroImageUrl ?? nextHeroImageUrl,
            heroMediaType: eventDetail?.heroMediaType ?? nextHeroMediaType,
            eventPrice: eventDetail?.price ?? nextEventPrice,
            eventStartsAt: eventDetail?.eventStartsAt,
            tableCapacity: eventDetail?.tableCapacity,
            tablesRemaining: eventDetail?.tablesRemaining,
            tablesSold: eventDetail?.tablesSold,
            eventDateIso: nextEventDateIso,
            reservationsOpen: availability.reservationsOpen,
            salesClosedReason: availability.salesClosedReason,
            reservedLayoutItemIds: availability.reservedLayoutItemIds,
            reservedVenueTableConfigIds: availability.reservedVenueTableConfigIds,
            reservedSeatShortLabels: availability.reservedSeatShortLabels,
            paidSeatHolders: availability.paidSeatHolders,
          });

          setHasLoadedOnce(true);
        } catch {
          if (!silent) {
            setError("Could not load floor plan.");
          }
        } finally {
          if (!silent) {
            setLoading(false);
          }
        }
      })();

      loadInFlight.set(key, run);
      try {
        await run;
      } finally {
        loadInFlight.delete(key);
      }
    },
    [eventSlug, hasLoadedOnce, hydrateFromCache],
  );

  const refreshAvailability = useCallback(async () => {
    if (!hasLoadedOnce) return;
    try {
      const [availability, eventDetail] = await Promise.all([
        fetchVenueReservationAvailability(eventSlug),
        eventSlug ? fetchOnComingEventDetail(eventSlug).catch(() => null) : Promise.resolve(null),
      ]);
      applyAvailability(availability, eventDetail);
    } catch {
      // Keep cached UI; availability refresh is best-effort.
    }
  }, [applyAvailability, eventSlug, hasLoadedOnce]);

  useEffect(() => {
    void load({ silent: Boolean(cachedEntry) });
  }, [load, cachedEntry]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshAvailability();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [refreshAvailability]);

  const handleBackNavigate = useCallback(() => {
    setLeaving(true);
  }, []);

  const handleItemSelect = useCallback(
    (id: string) => {
      setSelectedItemId(id);
    },
    [],
  );

  const showBusyOverlay = (loading && !hasLoadedOnce) || leaving;
  const busyTitle = loading ? "Loading floor plan…" : "Loading…";

  const pageShell = (content: ReactNode) => (
    <main className="relative z-10 flex min-h-screen flex-col overflow-x-hidden text-foreground">
      <OnComingEventHeroSection
        title={eventTitle}
        heroImageUrl={heroImageUrl}
        heroMediaType={heroMediaType}
        backFallbackHref={backFallbackHref}
        onBackNavigate={handleBackNavigate}
        price={eventPrice}
        showPrice={showHeroPrice}
      />
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col items-center px-4 py-20 text-center md:max-w-4xl">
        {content}
      </div>
      <Footer />
    </main>
  );

  return (
    <>
      <ShamellBusyOverlay active={showBusyOverlay} title={busyTitle} />

      {showBusyOverlay && loading ? <Footer /> : null}

      {!showBusyOverlay && !loading && clientEnabled === false
        ? pageShell(
            <>
              <h1 className="font-display text-2xl text-shamell-gold">On Coming Events unavailable</h1>
              <p className="mt-3 text-sm text-shamell-muted">
                The interactive floor plan is not published at this time.
              </p>
              <Link
                href={backFallbackHref}
                className="mt-6 inline-block text-sm text-shamell-gold underline-offset-2 hover:underline"
                onClick={() => handleBackNavigate()}
              >
                Return to events
              </Link>
            </>,
          )
        : null}

      {!showBusyOverlay &&
      !loading &&
      clientEnabled !== false &&
      (error || !layout || !standaloneChairs)
        ? pageShell(
            <p className="text-shamell-danger">{error ?? "Floor plan unavailable."}</p>,
          )
        : null}

      {!showBusyOverlay && !loading && clientEnabled !== false && layout && standaloneChairs ? (
        <main className="relative z-10 flex min-h-screen flex-col overflow-x-hidden text-foreground">
          <OnComingEventHeroSection
            title={eventTitle}
            heroImageUrl={heroImageUrl}
            heroMediaType={heroMediaType}
            backFallbackHref={backFallbackHref}
            onBackNavigate={handleBackNavigate}
            price={eventPrice}
            showPrice={showHeroPrice}
          />

          <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col items-center overflow-x-hidden px-4 pt-10 md:max-w-5xl">
            {eventDescription.trim() ? (
              <p className="min-w-0 w-full max-w-2xl text-center font-body text-base leading-relaxed break-all text-pretty text-foreground/88 sm:break-normal sm:wrap-anywhere md:text-lg">
                {eventDescription}
              </p>
            ) : null}

            {(showCountdown && eventStartsAt) || showTableInventory ? (
              <div
                className={
                  showCountdown && eventStartsAt && showTableInventory
                    ? "mt-10 grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-5"
                    : "mt-10 w-full max-w-2xl"
                }
              >
                {showCountdown && eventStartsAt ? (
                  <ShamellCountdown
                    targetAt={eventStartsAt}
                    label="Event begins in"
                    className="h-full"
                  />
                ) : null}
                {showTableInventory ? (
                  <FixedTicketInventoryDisplay
                    className="h-full"
                    fixedTicketCapacity={tableCapacity!}
                    ticketsRemaining={tablesRemaining ?? tableCapacity!}
                    ticketsSold={tablesSold}
                    soldOut={seatingSoldOut}
                    size="md"
                    inventoryType="table"
                  />
                ) : null}
              </div>
            ) : null}

            {seatingSoldOut ? (
              <p
                className="mt-4 text-center font-body text-base text-foreground/45 md:text-lg"
                role="status"
              >
                All tables have been sold
              </p>
            ) : null}

            <OnComingEventItemsSection items={eventItems} />
          </div>

          <div
            className="relative mx-auto mt-10 w-full max-w-[min(100%,1920px)] px-2 pb-16 sm:px-4 md:px-6 lg:px-10 min-[1920px]:max-w-[min(100%,2400px)]"
            style={{ ["--venue-chrome" as string]: sceneLayout.chromeCss }}
          >
            <div
              ref={sceneContainerRef}
              className="relative isolate w-full overflow-hidden rounded-lg border border-shamell-line-soft bg-[#1a1218] shadow-[0_24px_64px_rgba(0,0,0,0.45)] sm:rounded-xl"
            >
              <VenueScene3D
                mode="public-select"
                viewBoxWidth={layout.viewBoxWidth}
                viewBoxHeight={layout.viewBoxHeight}
                items={layout.items}
                sceneZones={layout.sceneZones}
                selectedId={selectedItemId}
                reservedIds={reservedIds}
                reservedLabels={reservedLabels}
                itemLabels={itemLabels}
                onItemSelect={handleItemSelect}
                viewportHeight={sceneLayout.viewportHeight}
                viewportMinHeight={sceneLayout.viewportMinHeight}
                layoutBucket={sceneLayout.bucket}
                dpr={sceneLayout.dpr}
                perfProfile={sceneLayout.perfProfile}
                sceneActive={sceneVisible}
              />
              {placedSummary ? (
                <VenueSceneLegend
                  placedSummary={placedSummary}
                  showReservationKey
                  layoutTopOnNarrow={sceneLayout.isPhone || sceneLayout.isTablet}
                  showMobileLabelHint={sceneLayout.perfProfile === "mobile"}
                />
              ) : null}
            </div>
          </div>

          <Footer />
        </main>
      ) : null}

      {selectedItem && !showBusyOverlay && layout && standaloneChairs ? (
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
