"use client";

import { useEffect, useMemo, useState } from "react";
import { EventCatalogCard, type EventCatalogItem } from "@/components/catalog/EventCatalogCard";
import RevealOnView from "@/components/shared/RevealOnView";
import CatalogCardCarousel from "@/components/shared/CatalogCardCarousel";
import { useInViewLoad } from "@/hooks/use-in-view-load";
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
  heroPosterUrl?: string | null;
  heroPosterUrlMobile?: string | null;
};

type ValidEventApiItem = Required<Pick<EventsApiItem, "id" | "eventTypeName" | "description" | "items">> &
  Pick<
    EventsApiItem,
    | "contactInquiryCode"
    | "price"
    | "images"
    | "heroImageUrl"
    | "heroMediaType"
    | "heroPosterUrl"
    | "heroPosterUrlMobile"
  >;

const isValidEvent = (item: EventsApiItem): item is ValidEventApiItem =>
  Boolean(
    item.id &&
      item.eventTypeName &&
      item.description &&
      Array.isArray(item.items) &&
      item.items.length > 0,
  );

const ServicesSection = () => {
  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, ""),
    [],
  );
  const { ref, inView } = useInViewLoad<HTMLElement>();
  const [services, setServices] = useState<EventCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!inView) return;
    let isCancelled = false;
    setIsLoading(true);

    fetch(`${apiBaseUrl}/api/v1/events?publicSection=GENERAL`)
      .then((response) => {
        if (!response.ok) throw new Error("Cannot load events.");
        return response.json();
      })
      .then((data: unknown) => {
        if (isCancelled || !Array.isArray(data)) return;

        const normalized = (data as EventsApiItem[])
          .filter(isValidEvent)
          .map((item) => {
            const rawPrice = item.price;
            const priceParsed =
              rawPrice === null || rawPrice === undefined
                ? null
                : typeof rawPrice === "number"
                  ? rawPrice
                  : Number(rawPrice);
            const imgs = Array.isArray(item.images) ? item.images.filter((u) => typeof u === "string" && u.trim()) : [];
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
            const heroMediaType: "IMAGE" | "VIDEO" =
              explicitMt === "VIDEO"
                ? "VIDEO"
                : explicitMt === "IMAGE"
                  ? "IMAGE"
                  : serviceCatalogMediaTypeFromUrl(heroUrl) === "VIDEO"
                    ? "VIDEO"
                    : "IMAGE";
            return {
              id: item.id,
              eventTypeName: item.eventTypeName,
              description: item.description,
              eventTypes: item.items,
              contactInquiryCode: item.contactInquiryCode ?? null,
              price: Number.isFinite(priceParsed as number) ? (priceParsed as number) : null,
              heroImageUrl: heroUrl,
              heroMediaType,
              heroPosterUrl:
                typeof item.heroPosterUrl === "string" ? item.heroPosterUrl : null,
              heroPosterUrlMobile:
                typeof item.heroPosterUrlMobile === "string"
                  ? item.heroPosterUrlMobile
                  : null,
            };
          });

        setServices(normalized);
      })
      .catch(() => {
        if (!isCancelled) setServices([]);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [apiBaseUrl, inView]);

  return (
    <section
      ref={ref}
      id="experiences"
      className="overflow-x-hidden bg-transparent px-4 pb-20 pt-0"
    >
      <div className="relative mx-auto mb-12 max-w-6xl text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
          <div className="h-24 w-[min(20rem,88vw)] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(120,90,160,0.12),transparent_70%)] blur-3xl opacity-80" />
        </div>
        <RevealOnView className="relative" delay={40}>
          <h2 className="mb-4 font-brand text-2xl font-semibold tracking-[0.14em] text-gold md:mb-5 md:text-4xl md:tracking-[0.16em]">
            TYPES OF EVENTS
          </h2>
          <p className="mx-auto mb-10 max-w-3xl text-center font-body text-lg font-medium leading-relaxed text-foreground/88 sm:text-xl sm:leading-relaxed md:text-2xl md:leading-[1.65] md:text-foreground/90">
            Browse performance packages by event type—each card outlines what is included, how to inquire,
            and the visual tone you can expect for your stage or venue.
          </p>
        </RevealOnView>
      </div>

      <div className="mx-auto max-w-6xl">
        {isLoading ? (
          <p className="text-center font-body text-base font-medium text-foreground/85 md:text-lg md:text-foreground/88">
            Loading event types...
          </p>
        ) : null}

        {!isLoading && services.length === 0 ? (
          <p className="text-center font-body text-base font-medium text-foreground/85 md:text-lg md:text-foreground/88">
            Event types coming soon.
          </p>
        ) : null}

        <CatalogCardCarousel ariaLabel="Types of events">
          {services.map((service, index) => (
            <EventCatalogCard key={service.id} service={service} index={index} />
          ))}
        </CatalogCardCarousel>
      </div>
    </section>
  );
};

export default ServicesSection;
export type { EventCatalogItem };
