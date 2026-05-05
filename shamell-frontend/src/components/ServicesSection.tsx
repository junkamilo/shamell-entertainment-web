"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { buildEventLineContactHref } from "@/lib/contactInquiryConstants";

type EventCatalogItem = {
  id: string;
  eventTypeName: string;
  description: string;
  eventTypes: string[];
  contactInquiryCode?: string | null;
};

type EventsApiItem = {
  id?: string;
  eventTypeName?: string;
  description?: string;
  items?: string[];
  contactInquiryCode?: string | null;
};

type ValidEventApiItem = Required<Pick<EventsApiItem, "id" | "eventTypeName" | "description" | "items">> &
  Pick<EventsApiItem, "contactInquiryCode">;

const isValidEvent = (item: EventsApiItem): item is ValidEventApiItem =>
  Boolean(
    item.id &&
      item.eventTypeName &&
      item.description &&
      Array.isArray(item.items) &&
      item.items.length > 0,
  );

const serviceCardLinkClass = cn(
  "relative inline-flex min-h-11 flex-1 items-center justify-center overflow-hidden border border-white/20 bg-black/50 px-4 py-2.5 font-brand text-[10px] tracking-[0.16em] text-gold uppercase",
  "transition-all duration-300",
  "before:pointer-events-none before:absolute before:inset-0 before:translate-x-[-110%] before:bg-[linear-gradient(105deg,transparent,rgba(255,255,255,0.1),transparent)] before:transition-transform before:duration-500",
  "hover:border-white/35 hover:text-gold-light group-hover:before:translate-x-[110%]",
);

const ServiceCard = ({ service, index = 0 }: { service: EventCatalogItem; index?: number }) => {
  const delayMs = Math.min(index, 8) * 100;
  const inquireHref = buildEventLineContactHref(service.id);

  return (
    <article
      style={{ animationDelay: `${delayMs}ms` }}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl",
        "border border-gold/22 bg-[linear-gradient(168deg,rgba(22,19,14,0.96)_0%,rgba(10,9,7,0.99)_52%,rgba(4,3,2,1)_100%)]",
        "shadow-[0_14px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.04)]",
        "ring-1 ring-white/6",
        "animate-shamell-exp-card-in",
        "transition-[transform,box-shadow,border-color,ring-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-2 hover:border-white/14 hover:shadow-[0_32px_88px_rgba(0,0,0,0.75),0_1px_0_rgba(255,255,255,0.05)_inset]",
        "hover:ring-white/10",
        "motion-reduce:hover:translate-y-0 motion-reduce:transition-colors",
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      >
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(110%_70%_at_50%_0%,rgba(255,255,255,0.055),transparent_50%)]" />
      </div>

      <span
        className="pointer-events-none absolute left-2.5 top-2.5 z-20 h-6 w-6 border-l border-t border-white/25 opacity-50 transition-all duration-500 group-hover:left-2 group-hover:top-2 group-hover:border-white/45 group-hover:opacity-100"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute right-2.5 top-2.5 z-20 h-6 w-6 border-r border-t border-white/25 opacity-50 transition-all duration-500 group-hover:right-2 group-hover:top-2 group-hover:border-white/45 group-hover:opacity-100"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-2.5 left-2.5 z-20 h-6 w-6 border-l border-b border-white/15 opacity-35 transition-all duration-500 group-hover:border-white/35 group-hover:opacity-90"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-2.5 right-2.5 z-20 h-6 w-6 border-r border-b border-white/15 opacity-35 transition-all duration-500 group-hover:border-white/35 group-hover:opacity-90"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      >
        <div className="animate-shamell-exp-sheen absolute -inset-2 h-full w-1/2 bg-[linear-gradient(95deg,transparent,rgba(230,236,245,0.12),transparent)] blur-md" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col p-6 md:p-8">
        <div className="mb-1 border-b border-white/8 pb-3 transition-colors duration-500 group-hover:border-white/15">
          <h3 className="min-h-10 font-brand text-lg tracking-[0.14em] text-gold md:text-xl md:tracking-[0.16em]">
            {service.eventTypeName.toUpperCase()}
          </h3>
        </div>

        <p className="mt-4 min-h-18 text-base font-body leading-relaxed text-foreground/80 transition-colors duration-300 group-hover:text-foreground/90">
          {service.description}
        </p>

        <div className="mb-6 mt-5 flex-1">
          <h4 className="relative mb-3 inline-block font-brand text-[10px] tracking-[0.22em] text-gold/95">
            EVENT TYPES
            <span
              className="absolute -bottom-1 left-0 h-px w-0 bg-linear-to-r from-transparent via-white/40 to-transparent transition-all duration-500 ease-out group-hover:w-full"
              aria-hidden
            />
          </h4>
          <div className="relative pl-1">
            <span
              className="absolute bottom-0.5 left-[0.45rem] top-1.5 w-px bg-linear-to-b from-white/5 via-white/22 to-white/5 transition-all duration-500 group-hover:via-white/32"
              aria-hidden
            />
            <ul className="relative space-y-2">
              {service.eventTypes.map((item, i) => (
                <li
                  key={`${service.id}-${i}`}
                  style={{ transitionDelay: `${i * 30}ms` }}
                  className="relative flex gap-2.5 pl-5 text-sm font-body leading-snug text-foreground/68 transition-[transform,color] duration-300 group-hover:translate-x-1 group-hover:text-foreground/85 motion-reduce:group-hover:translate-x-0"
                >
                  <span className="absolute left-0 top-[0.35rem] text-[9px] text-gold/90 transition-transform duration-300 group-hover:scale-125">
                    ✦
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-3 border-t border-gold/12 pt-4 sm:flex-row sm:gap-3">
          <Link href={inquireHref} prefetch={false} className={cn(serviceCardLinkClass, "sm:flex-1")}>
            <span className="relative z-10">Inquire</span>
          </Link>
        </div>
      </div>
    </article>
  );
};

const ServicesSection = () => {
  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, ""),
    [],
  );
  const [services, setServices] = useState<EventCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
          .map((item) => ({
            id: item.id,
            eventTypeName: item.eventTypeName,
            description: item.description,
            eventTypes: item.items,
            contactInquiryCode: item.contactInquiryCode ?? null,
          }));

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
        <div className="relative">
          <h2 className="mb-2 font-brand text-sm tracking-[0.28em] text-gold md:text-base">
            SERVICE CATALOG
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-center font-body text-base text-foreground/60">
            Three tiers of experience—from intimate galas to fully bespoke productions. Each level
            includes different scope, production depth, and pricing transparency.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl">

        {isLoading ? (
          <p className="text-center text-foreground/60 text-base font-body">Loading event catalog...</p>
        ) : null}

        {!isLoading && services.length === 0 ? (
          <p className="text-center text-foreground/60 text-base font-body">
            Event catalog coming soon.
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-0 lg:divide-x lg:divide-gold/20">
          {services.map((service, index) => (
            <div key={service.id} className="h-full lg:px-4 first:lg:pl-0 last:lg:pr-0">
              <ServiceCard service={service} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
