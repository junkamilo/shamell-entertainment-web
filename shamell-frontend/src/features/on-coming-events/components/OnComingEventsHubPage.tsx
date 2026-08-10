"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/shared";
import { ShamellBusyOverlay } from "@/components/shared";
import { fetchPublicUpcomingHubEvents } from "../services/fetchPublicUpcomingHubEvents";
import { OnComingEventsHubHero } from "./OnComingEventsHubHero";
import {
  OnComingEventHubCard,
  type OnComingEventHubCardItem,
} from "./OnComingEventHubCard";

type HubEvent = OnComingEventHubCardItem;

export default function OnComingEventsHubPage() {
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
    void fetchPublicUpcomingHubEvents()
      .then((normalized) => {
        if (!cancelled) setEvents(normalized);
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
  }, []);

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
                    <div className="flex w-max min-w-full justify-center gap-4">
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
