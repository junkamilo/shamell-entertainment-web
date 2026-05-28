"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { formatCatalogPriceAmount } from "@/lib/formatCatalogPrice";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import { onComingEventHubHref } from "@/lib/upcomingEventPublicRoutes";
import {
  fetchOnComingEventDetail,
  type OnComingEventDetail,
} from "../services/fetchOnComingEventDetail";
import { OnComingEventItemsSection } from "./OnComingEventItemsSection";
import { OnComingEventScheduleSection } from "./OnComingEventScheduleSection";
import { OnComingEventStickyPurchaseBar } from "./OnComingEventStickyPurchaseBar";
import { OnComingEventClassBookingModal } from "./OnComingEventClassBookingModal";

type Props = { slug: string };

export default function OnComingEventDetailPage({ slug }: Props) {
  const [event, setEvent] = useState<OnComingEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOnComingEventDetail(slug);
      setEvent(data);
    } catch {
      setError("This event could not be found.");
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const heroUrl = event?.heroImageUrl ?? null;
  const heroIsVideo =
    event?.heroMediaType === "VIDEO" || serviceCatalogMediaTypeFromUrl(heroUrl) === "VIDEO";
  const hasPrice = event?.price != null && !Number.isNaN(Number(event.price));

  return (
    <main className="relative z-10 min-h-screen text-foreground">
      <SiteHeader />

      {loading ? (
        <p className="px-4 pt-32 text-center text-foreground/70">Loading event…</p>
      ) : null}

      {error ? (
        <div className="px-4 pt-32 text-center">
          <p className="text-foreground/70">{error}</p>
          <Link href={onComingEventHubHref()} className="mt-6 inline-block text-sm text-gold hover:underline">
            All On Coming Events
          </Link>
        </div>
      ) : null}

      {!loading && !error && event ? (
        <>
          <section className="relative min-h-[42vh] w-full overflow-hidden md:min-h-[50vh]">
            {heroUrl ? (
              heroIsVideo ? (
                <video
                  src={heroUrl}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  muted
                  playsInline
                  loop
                  autoPlay
                  aria-label={`${event.eventTypeName} hero`}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
              )
            ) : (
              <div className="absolute inset-0 bg-[#0a0908]" />
            )}
            <div className="absolute inset-0 bg-black/55" aria-hidden />
            <div className="relative flex min-h-[42vh] flex-col items-center justify-center px-4 py-24 md:min-h-[50vh]">
              {hasPrice ? (
                <div
                  className="absolute right-4 top-24 rounded-lg border border-gold/50 bg-black/60 px-4 py-2 text-center shadow-lg md:right-8 md:top-28"
                  aria-label={`Price ${formatCatalogPriceAmount(event.price!)} USD`}
                >
                  <span className="font-display text-2xl text-gold md:text-3xl">
                    {formatCatalogPriceAmount(event.price!)}
                  </span>
                  <span className="mt-0.5 block font-brand text-[10px] tracking-[0.2em] text-gold/80">
                    USD
                  </span>
                </div>
              ) : null}
              <h1 className="max-w-3xl text-center font-display text-3xl text-gold md:text-5xl">
                {event.eventTypeName}
              </h1>
            </div>
          </section>

          <div className="mx-auto max-w-3xl px-4 pb-36 pt-10 md:max-w-4xl md:pb-40">
            {event.description ? (
              <p className="text-center font-body text-base leading-relaxed text-foreground/88 md:text-lg">
                {event.description}
              </p>
            ) : null}

            <OnComingEventItemsSection items={event.items} />

            <OnComingEventScheduleSection schedule={event.schedule} />

            <p className="mt-12 text-center">
              <Link href={onComingEventHubHref()} className="text-sm text-gold hover:underline">
                All On Coming Events
              </Link>
            </p>
          </div>

          <OnComingEventStickyPurchaseBar
            slug={slug}
            experienceType={event.experienceType}
            purchasable={event.purchasable}
            salesOpen={event.salesOpen}
            hasActiveSessions={event.hasActiveSessions}
            onBookClasses={() => setBookingOpen(true)}
          />

          {event.experienceType === "CLASSES" ? (
            <OnComingEventClassBookingModal
              slug={slug}
              sessions={event.sessions}
              open={bookingOpen}
              onClose={() => setBookingOpen(false)}
            />
          ) : null}
        </>
      ) : null}

      <Footer />
    </main>
  );
}
