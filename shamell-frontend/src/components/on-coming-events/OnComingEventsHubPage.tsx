"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import {
  OnComingEventHubCard,
  type OnComingEventHubCardItem,
} from "@/app/on-coming-events/components/OnComingEventHubCard";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";

type HubEvent = OnComingEventHubCardItem;

export default function OnComingEventsHubPage() {
  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, ""),
    [],
  );
  const [events, setEvents] = useState<HubEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
            return {
              slug: String(item.slug),
              eventTypeName: String(item.eventTypeName),
              heroImageUrl: heroUrl || null,
              heroMediaType,
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

  return (
    <main className="relative z-10 min-h-screen text-foreground">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-28 md:pt-32">
        <div className="mb-10 text-center">
          <h1 className="font-brand text-2xl font-semibold tracking-[0.14em] text-gold md:text-4xl">
            ON COMING EVENTS
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-base text-foreground/85 md:text-lg">
            Browse upcoming experiences and view full details before you book.
          </p>
        </div>

        {isLoading ? (
          <p className="text-center text-foreground/70">Loading upcoming events…</p>
        ) : null}

        {!isLoading && events.length === 0 ? (
          <p className="text-center text-foreground/70">Upcoming events coming soon.</p>
        ) : null}

        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-6 md:gap-8">
          {events.map((event) => (
            <OnComingEventHubCard key={event.slug} event={event} />
          ))}
        </div>

        <p className="mt-10 text-center">
          <Link href="/" className="text-sm text-gold underline-offset-2 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
      <Footer />
    </main>
  );
}
