"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import Footer from "@/components/Footer";
import ShamellBusyOverlay from "@/components/shared/ShamellBusyOverlay";
import { OnComingEventsHubHero } from "./OnComingEventsHubHero";
import {
  OnComingEventHubCard,
  type OnComingEventHubCardItem,
} from "./OnComingEventHubCard";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import { parseApiInt } from "@/lib/fixedTicketInventory";

type HubEvent = OnComingEventHubCardItem;

export default function OnComingEventsHubPage() {
  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, ""),
    [],
  );
  const [events, setEvents] = useState<HubEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [navigatingToEvent, setNavigatingToEvent] = useState(false);

  const handleBackNavigate = useCallback(() => {
    setLeaving(true);
  }, []);

  const handleEventNavigate = useCallback(() => {
    setNavigatingToEvent(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetch(`${apiBaseUrl}/api/v1/events?publicSection=UPCOMING_EVENTS`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        if (cancelled || !Array.isArray(data)) return;
        const normalized = (data as Record<string, unknown>[])
          .filter(
            (item) =>
              typeof item.id === "string" &&
              typeof item.slug === "string" &&
              item.slug.length > 0 &&
              typeof item.eventTypeName === "string",
          )
          .map((item) => {
            const heroUrl =
              typeof item.heroImageUrl === "string" ? item.heroImageUrl : "";
            const explicitMt =
              item.heroMediaType != null && typeof item.heroMediaType === "string"
                ? item.heroMediaType.toUpperCase()
                : "";
            const heroMediaType: "IMAGE" | "VIDEO" =
              explicitMt === "VIDEO" || serviceCatalogMediaTypeFromUrl(heroUrl) === "VIDEO"
                ? "VIDEO"
                : "IMAGE";
            const purchaseMode =
              item.purchaseMode === "venue_seating" ||
              item.purchaseMode === "classes" ||
              item.purchaseMode === "fixed_ticket" ||
              item.purchaseMode === "none"
                ? item.purchaseMode
                : item.experienceType === "VENUE_SEATING"
                  ? "venue_seating"
                  : item.experienceType === "CLASSES"
                    ? "classes"
                    : "none";
            return {
              slug: String(item.slug),
              eventTypeName: String(item.eventTypeName),
              heroImageUrl: heroUrl || null,
              heroMediaType,
              experienceType:
                item.experienceType === "VENUE_SEATING" || item.experienceType === "CLASSES"
                  ? item.experienceType
                  : null,
              purchaseMode,
              purchasable: item.purchasable === true,
              ...(parseApiInt(item.ticketsRemaining) !== undefined
                ? { ticketsRemaining: parseApiInt(item.ticketsRemaining) }
                : {}),
              ...(parseApiInt(item.fixedTicketCapacity) !== undefined
                ? { fixedTicketCapacity: parseApiInt(item.fixedTicketCapacity) }
                : {}),
              ...(parseApiInt(item.ticketsSold) !== undefined
                ? { ticketsSold: parseApiInt(item.ticketsSold) }
                : {}),
              ...(parseApiInt(item.tableCapacity) !== undefined
                ? { tableCapacity: parseApiInt(item.tableCapacity) }
                : {}),
              ...(parseApiInt(item.tablesRemaining) !== undefined
                ? { tablesRemaining: parseApiInt(item.tablesRemaining) }
                : {}),
              ...(parseApiInt(item.tablesSold) !== undefined
                ? { tablesSold: parseApiInt(item.tablesSold) }
                : {}),
              ...(typeof item.eventStartsAt === "string" && item.eventStartsAt
                ? { eventStartsAt: item.eventStartsAt }
                : {}),
            } satisfies HubEvent;
          });
        setEvents(normalized);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  const showBusyOverlay = isLoading || leaving || navigatingToEvent;
  const busyTitle = isLoading
    ? "Loading upcoming events…"
    : leaving
      ? "Loading…"
      : "Loading event…";
  const showContent = !isLoading && !leaving && !navigatingToEvent;

  return (
    <>
      <ShamellBusyOverlay active={showBusyOverlay} title={busyTitle} />

      {showContent ? (
        <main className="relative z-10 min-h-screen text-foreground">
          <div className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-4 pb-20 pt-6 md:pt-8">
            <OnComingEventsHubHero onBackNavigateStart={handleBackNavigate} />

            <p className="mx-auto mb-10 max-w-2xl text-center font-body text-base text-foreground/85 md:text-lg">
              Browse upcoming experiences and view full details before you book.
            </p>

            {events.length === 0 ? (
              <p className="text-center text-foreground/70">Upcoming events coming soon.</p>
            ) : null}

            {events.length > 0 ? (
              <>
                <div className="min-w-0 w-full sm:hidden">
                  <div
                    className={cn(
                      "shamell-scrollbar -mx-4 min-w-0 overflow-x-auto px-6 pb-2",
                      "snap-x snap-mandatory scroll-pl-6 scroll-pr-6",
                      "overscroll-x-contain [-webkit-overflow-scrolling:touch]",
                    )}
                  >
                    <div className="flex w-max gap-4">
                      {events.map((event) => (
                        <OnComingEventHubCard
                          key={`mobile-${event.slug}`}
                          event={event}
                          onNavigateStart={handleEventNavigate}
                          mobileCarousel
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mx-auto hidden max-w-5xl flex-wrap justify-center gap-6 sm:flex md:gap-8">
                  {events.map((event) => (
                    <OnComingEventHubCard
                      key={event.slug}
                      event={event}
                      onNavigateStart={handleEventNavigate}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>
          <Footer />
        </main>
      ) : null}
    </>
  );
}
