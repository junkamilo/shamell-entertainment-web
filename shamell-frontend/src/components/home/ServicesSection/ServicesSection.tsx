"use client";

import { useEffect, useMemo, useState } from "react";
import { EventCatalogCard, type EventCatalogItem } from "@/components/catalog";
import { RevealOnView, CatalogCardCarousel } from "@/components/shared";
import { useInViewLoad } from "@/hooks/use-in-view-load";
import { mapPublicGeneralEventsCatalog } from "@/lib/home/mapHomeCatalogSeeds";

type ServicesSectionProps = {
  initialServices?: EventCatalogItem[] | null;
};

const ServicesSection = ({ initialServices = null }: ServicesSectionProps) => {
  const hasSeed = Array.isArray(initialServices) && initialServices.length > 0;
  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, ""),
    [],
  );
  const { ref, inView } = useInViewLoad<HTMLElement>({ enabled: !hasSeed });
  const [services, setServices] = useState<EventCatalogItem[]>(hasSeed ? initialServices! : []);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (hasSeed) {
      setServices(initialServices!);
      setIsLoading(false);
      return;
    }
    if (!inView) return;
    let isCancelled = false;
    setIsLoading(true);

    fetch(`${apiBaseUrl}/api/v1/events?publicSection=GENERAL`)
      .then((response) => {
        if (!response.ok) throw new Error("Cannot load events.");
        return response.json();
      })
      .then((data: unknown) => {
        if (isCancelled) return;
        setServices(mapPublicGeneralEventsCatalog(data));
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
  }, [apiBaseUrl, hasSeed, inView, initialServices]);

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
          {services.map((item) => (
            <EventCatalogCard key={item.id} item={item} />
          ))}
        </CatalogCardCarousel>
      </div>
    </section>
  );
};

export default ServicesSection;
export type { EventCatalogItem };
