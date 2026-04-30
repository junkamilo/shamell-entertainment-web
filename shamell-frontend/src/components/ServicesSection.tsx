"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type EventCatalogItem = {
  id: string;
  eventTypeName: string;
  description: string;
  eventTypes: string[];
};

type EventsApiItem = {
  id?: string;
  eventTypeName?: string;
  description?: string;
  items?: string[];
};

const isValidEvent = (
  item: EventsApiItem,
): item is Required<Pick<EventsApiItem, "id" | "eventTypeName" | "description" | "items">> =>
  Boolean(
    item.id &&
      item.eventTypeName &&
      item.description &&
      Array.isArray(item.items) &&
      item.items.length > 0,
  );

const ServiceCard = ({ service }: { service: EventCatalogItem }) => {
  return (
    <article
      className="relative flex h-full flex-col border border-gold/35 bg-black/25 p-6 md:p-8 transition-shadow duration-300 hover:gold-glow"
    >
      <h3 className="min-h-14 font-brand text-gold text-lg md:text-xl tracking-[0.12em] mb-2">
        {service.eventTypeName.toUpperCase()}
      </h3>

      <p className="min-h-18 text-foreground/80 text-base font-body leading-relaxed mb-4">
        {service.description}
      </p>

      <div className="mb-5">
        <h4 className="font-brand text-gold/90 text-[10px] tracking-[0.18em] mb-2">
          EVENT TYPES
        </h4>
        <ul className="space-y-1.5">
          {service.eventTypes.map((item) => (
            <li
              key={item}
              className="text-foreground/65 text-sm font-body flex gap-2 leading-snug"
            >
              <span className="text-gold shrink-0 mt-0.5">✦</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href="/contacto"
          className="btn-outline-gold font-brand text-xs text-center justify-center flex-1"
        >
          Consultar
        </Link>
        <Link
          href="/contacto"
          className="btn-outline-gold font-brand text-xs text-center justify-center flex-1"
        >
          Inquire
        </Link>
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
    <section id="services" className="bg-background pt-0 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-brand text-gold text-center text-sm md:text-base tracking-[0.28em] mb-2">
          SERVICE CATALOG
        </h2>
        <p className="text-center text-foreground/60 text-base font-body max-w-2xl mx-auto mb-12">
          Three tiers of experience—from intimate galas to fully bespoke productions. Each level
          includes different scope, production depth, and pricing transparency.
        </p>

        {isLoading ? (
          <p className="text-center text-foreground/60 text-base font-body">Loading event catalog...</p>
        ) : null}

        {!isLoading && services.length === 0 ? (
          <p className="text-center text-foreground/60 text-base font-body">
            Event catalog coming soon.
          </p>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-0 lg:divide-x lg:divide-gold/20">
          {services.map((service) => (
            <div key={service.id} className="h-full lg:px-4 first:lg:pl-0 last:lg:pr-0">
              <ServiceCard service={service} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
