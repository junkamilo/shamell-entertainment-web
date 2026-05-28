"use client";

import { useEffect, useMemo, useState } from "react";
import {
  OnComingEventHubCard,
  type OnComingEventHubCardItem,
} from "@/app/on-coming-events/components/OnComingEventHubCard";
import RevealOnView from "@/components/shared/RevealOnView";
import CatalogCardCarousel from "@/components/shared/CatalogCardCarousel";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";

type EventsApiItem = {
  id?: string;
  eventTypeName?: string;
  description?: string;
  items?: string[];
  contactInquiryCode?: string | null;
  price?: number | null;
  images?: string[];
  heroImageUrl?: string | null;
  heroMediaType?: string | null;
  slug?: string;
  experienceType?: string;
};

type ValidEventApiItem = Required<
  Pick<EventsApiItem, "id" | "eventTypeName" | "description" | "items">
> &
  Pick<
    EventsApiItem,
    "contactInquiryCode" | "price" | "images" | "heroImageUrl" | "heroMediaType" | "slug" | "experienceType"
  >;

const isValidEvent = (item: EventsApiItem): item is ValidEventApiItem =>
  Boolean(
    item.id &&
      item.eventTypeName &&
      item.description &&
      Array.isArray(item.items) &&
      item.items.length > 0,
  );

export default function UpcomingEventsSection() {
  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, ""),
    [],
  );
  const [events, setEvents] = useState<OnComingEventHubCardItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    fetch(`${apiBaseUrl}/api/v1/events?publicSection=UPCOMING_EVENTS`)
      .then((response) => {
        if (!response.ok) throw new Error("Cannot load upcoming events.");
        return response.json();
      })
      .then((data: unknown) => {
        if (isCancelled || !Array.isArray(data)) return;

        const normalized: OnComingEventHubCardItem[] = (data as EventsApiItem[])
          .filter(isValidEvent)
          .flatMap((item) => {
            const imgs = Array.isArray(item.images)
              ? item.images.filter((u) => typeof u === "string" && u.trim())
              : [];
            const heroUrl =
              typeof item.heroImageUrl === "string" && item.heroImageUrl.trim()
                ? item.heroImageUrl.trim()
                : imgs.length > 0
                  ? imgs[0]
                  : null;
            const explicitMt =
              typeof item.heroMediaType === "string" && item.heroMediaType.trim()
                ? item.heroMediaType.trim().toUpperCase()
                : "";
            const inferredFromUrl = serviceCatalogMediaTypeFromUrl(heroUrl);
            const heroMediaType: "IMAGE" | "VIDEO" =
              explicitMt === "VIDEO" || inferredFromUrl === "VIDEO" ? "VIDEO" : "IMAGE";
            const slug = typeof item.slug === "string" ? item.slug.trim() : "";
            if (!slug) return [];
            return [
              {
                slug,
                eventTypeName: item.eventTypeName,
                heroImageUrl: heroUrl,
                heroMediaType,
              },
            ];
          });

        setEvents(normalized);
      })
      .catch(() => {
        if (!isCancelled) setEvents([]);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [apiBaseUrl]);

  return (
    <section id="upcoming-events" className="bg-transparent px-4 pb-20 pt-0">
      <div className="relative mx-auto mb-12 max-w-6xl text-center">
        <RevealOnView className="relative" delay={40}>
          <h2 className="mb-4 font-brand text-2xl font-semibold tracking-[0.14em] text-gold md:mb-5 md:text-4xl md:tracking-[0.16em]">
            ON COMING EVENTS
          </h2>
          <p className="mx-auto mb-10 max-w-3xl text-center font-body text-lg font-medium leading-relaxed text-foreground/88 sm:text-xl sm:leading-relaxed md:text-2xl md:leading-[1.65] md:text-foreground/90">
            Discover on coming experiences curated by Shamell. View details, schedules, and book your place.
          </p>
        </RevealOnView>
      </div>

      <div className="mx-auto max-w-6xl">
        {isLoading ? (
          <p className="text-center font-body text-base font-medium text-foreground/85 md:text-lg md:text-foreground/88">
            Loading upcoming events...
          </p>
        ) : null}

        {!isLoading && events.length === 0 ? (
          <p className="text-center font-body text-base font-medium text-foreground/85 md:text-lg md:text-foreground/88">
            Upcoming events coming soon.
          </p>
        ) : null}

        <CatalogCardCarousel ariaLabel="Upcoming events">
          {events.map((event) => (
            <OnComingEventHubCard key={event.slug} event={event} />
          ))}
        </CatalogCardCarousel>
      </div>
    </section>
  );
}
