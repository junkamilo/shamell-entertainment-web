"use client";

import { useOnComingEventsSettings } from "@/hooks/use-on-coming-events-settings";
import { usePublicUpcomingHubEvents } from "@/hooks/use-public-upcoming-hub-events";
import type { OnComingEventsPromo } from "@/lib/on-coming-events/onComingSettings";
import Link from "next/link";
import {
  OnComingEventHubCard,
  type OnComingEventHubCardItem,
} from "@/features/on-coming-events/components/OnComingEventHubCard";
import { RevealOnView, CatalogCardCarousel } from "@/components/shared";
import { ON_COMING_EVENTS_PUBLIC_PATH } from "@/lib/on-coming-events/onComingEventsRoutes";

type OnComingEventsPromoSectionProps = {
  initialSettings?: OnComingEventsPromo | null;
  initialEvents?: OnComingEventHubCardItem[];
};

export default function OnComingEventsPromoSection({
  initialSettings,
  initialEvents,
}: OnComingEventsPromoSectionProps = {}) {
  const { clientEnabled, promo, isLoading: settingsLoading } =
    useOnComingEventsSettings(initialSettings);
  const { events, isRefreshing } = usePublicUpcomingHubEvents({
    initialEvents,
    enabled: clientEnabled,
  });

  if (settingsLoading || !clientEnabled) return null;

  const title = promo.promoTitle?.trim() || "On Coming Events";
  const description =
    promo.promoDescription?.trim() ||
    "Discover on coming experiences curated by Shamell. View details, schedules, and book your place.";
  const showLoading = isRefreshing && events.length === 0;
  const showEmpty = !isRefreshing && events.length === 0;

  return (
    <section id="on-coming-events" className="bg-transparent px-4 py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <RevealOnView className="relative mb-10 text-center md:mb-12" delay={40}>
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="h-36 w-[min(28rem,94vw)] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(197,165,90,0.08),transparent_72%)] blur-3xl opacity-80" />
          </div>
          <div className="relative">
            <h2 className="font-brand text-2xl font-semibold tracking-[0.14em] text-gold md:text-4xl md:tracking-[0.16em]">
              {title}
            </h2>
            <div
              className="mx-auto mt-5 h-px w-20 max-w-48 bg-linear-to-r from-transparent via-white/25 to-transparent"
              aria-hidden
            />
            <p className="mx-auto mt-6 max-w-3xl font-body text-base font-medium leading-relaxed text-foreground/88 md:text-lg md:leading-relaxed md:text-foreground/90">
              {description}
            </p>
          </div>
        </RevealOnView>

        {showLoading ? (
          <p className="text-center font-body text-base font-medium text-foreground/85 md:text-lg">
            Loading upcoming events…
          </p>
        ) : null}

        {showEmpty ? (
          <p className="text-center font-body text-base font-medium text-foreground/85 md:text-lg">
            Upcoming events coming soon.
          </p>
        ) : null}

        {!showLoading && events.length > 0 ? (
          <RevealOnView delay={0} amount={0.12}>
            <CatalogCardCarousel ariaLabel="On coming events">
              {events.map((event, index) => (
                <OnComingEventHubCard
                  key={event.slug}
                  event={event}
                  priorityHero={index === 0}
                />
              ))}
            </CatalogCardCarousel>
            <div className="mt-10 flex justify-center">
              <Link
                href={ON_COMING_EVENTS_PUBLIC_PATH}
                className="inline-flex rounded-lg border border-gold/45 bg-gold/10 px-6 py-3 font-brand text-xs font-semibold uppercase tracking-[0.14em] text-gold transition hover:bg-gold/20"
              >
                View all events
              </Link>
            </div>
          </RevealOnView>
        ) : null}
      </div>
    </section>
  );
}
