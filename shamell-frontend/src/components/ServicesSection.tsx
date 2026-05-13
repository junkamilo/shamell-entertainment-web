"use client";

import { useEffect, useMemo, useState } from "react";
import { EventCatalogCard, type EventCatalogItem } from "@/components/catalog/EventCatalogCard";
import RevealOnView from "@/components/shared/RevealOnView";

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
};

type ValidEventApiItem = Required<Pick<EventsApiItem, "id" | "eventTypeName" | "description" | "items">> &
  Pick<EventsApiItem, "contactInquiryCode" | "price" | "images" | "heroImageUrl" | "heroMediaType">;

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
  const [services, setServices] = useState<EventCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    fetch(`${apiBaseUrl}/api/v1/events`)
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
            const heroMt =
              typeof item.heroMediaType === "string" && item.heroMediaType.trim()
                ? item.heroMediaType.trim().toUpperCase()
                : "IMAGE";
            const heroMediaType: "IMAGE" | "VIDEO" = heroMt === "VIDEO" ? "VIDEO" : "IMAGE";
            return {
              id: item.id,
              eventTypeName: item.eventTypeName,
              description: item.description,
              eventTypes: item.items,
              contactInquiryCode: item.contactInquiryCode ?? null,
              price: Number.isFinite(priceParsed as number) ? (priceParsed as number) : null,
              heroImageUrl: heroUrl,
              heroMediaType,
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
  }, [apiBaseUrl]);

  return (
    <section id="services" className="bg-transparent px-4 pb-20 pt-0">
      <div className="relative mx-auto mb-12 max-w-6xl text-center">
        <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2">
          <div className="h-24 w-[min(20rem,88vw)] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(120,90,160,0.12),transparent_70%)] blur-3xl opacity-80" />
        </div>
        <RevealOnView className="relative" delay={40}>
          <h2 className="mb-2 font-brand text-base font-semibold tracking-[0.24em] text-gold md:text-lg md:tracking-[0.26em]">
            SPECIAL EXPERIENCES
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center font-body text-base font-medium leading-relaxed text-foreground/88 md:text-lg md:leading-relaxed md:text-foreground/90">
            Three tiers of experience—from intimate galas to fully bespoke productions. Each level
            includes different scope, production depth, and pricing transparency.
          </p>
        </RevealOnView>
      </div>

      <div className="mx-auto max-w-6xl">
        {isLoading ? (
          <p className="text-center font-body text-base font-medium text-foreground/85 md:text-lg md:text-foreground/88">
            Loading event catalog...
          </p>
        ) : null}

        {!isLoading && services.length === 0 ? (
          <p className="text-center font-body text-base font-medium text-foreground/85 md:text-lg md:text-foreground/88">
            Event catalog coming soon.
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-10">
          {services.map((service, index) => (
            <RevealOnView key={service.id} className="h-full" delay={index * 80} amount={0.18}>
              <EventCatalogCard service={service} index={index} />
            </RevealOnView>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
export type { EventCatalogItem };
