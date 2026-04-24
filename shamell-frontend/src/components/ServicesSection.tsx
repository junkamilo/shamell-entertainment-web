"use client";

import { Flame, MonitorPlay, Compass, ChevronDown, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type ServiceTier = "essential" | "signature" | "bespoke";

type Service = {
  icon: LucideIcon;
  title: string;
  tier: ServiceTier;
  tierLabel: string;
  priceRange: string;
  shortDescription: string;
  longDescription: string;
  eventTypes: string[];
  path: string;
};

const services: Service[] = [
  {
    icon: Flame,
    title: "Private Galas",
    tier: "essential",
    tierLabel: "Essential",
    priceRange: "$250 – $1,000",
    shortDescription:
      "Intimate, high-impact performances for private celebrations and exclusive gatherings.",
    longDescription:
      "Ideal for hosts who want a refined Oriental dance experience without full production scale. Includes tailored choreography consultation, premium costuming, and seamless coordination with your planner or venue.",
    eventTypes: [
      "Private dinner parties",
      "Anniversary & milestone celebrations",
      "Estate & residence gatherings",
      "Small luxury hospitality events",
    ],
    path: "/private-galas",
  },
  {
    icon: MonitorPlay,
    title: "VIP Events",
    tier: "signature",
    tierLabel: "Signature",
    priceRange: "$600 – $2,500",
    shortDescription:
      "Stage-ready artistry for corporate galas, launches, and high-profile audiences.",
    longDescription:
      "Designed for larger venues and formal programs: extended sets, music coordination with your DJ or band, and optional ambient or spotlight formats. Elevates brand moments and VIP guest experiences with commanding presence.",
    eventTypes: [
      "Corporate galas & awards nights",
      "Product launches & brand activations",
      "Charity fundraisers & galas",
      "VIP lounges & after-parties",
    ],
    path: "/vip-events",
  },
  {
    icon: Compass,
    title: "Bespoke Collaborations",
    tier: "bespoke",
    tierLabel: "Tailored",
    priceRange: "Negotiated",
    shortDescription:
      "One-of-a-kind creative partnerships for brands, media, and visionary productions.",
    longDescription:
      "From concept to execution: co-developed performances with creative directors, photographers, and luxury brands. Destination bookings, ensemble work, and narrative-driven pieces scoped to your artistic and commercial goals.",
    eventTypes: [
      "Destination weddings & cultural events",
      "Film, commercial & editorial shoots",
      "Luxury brand experiences",
      "Artist & designer collaborations",
    ],
    path: "/bespoke-collaborations",
  },
];

const tierStyles: Record<ServiceTier, { border: string; badge: string; panel: string }> = {
  essential: {
    border: "border-gold/35",
    badge: "border-gold/50 text-gold/90 bg-gold/5",
    panel: "bg-black/25",
  },
  signature: {
    border: "border-gold/55",
    badge: "border-gold text-gold bg-gold/15",
    panel: "bg-gold/[0.06]",
  },
  bespoke: {
    border: "border-gold-light/40",
    badge: "border-gold-light text-gold-light bg-gold/20",
    panel: "bg-gold-light/[0.04]",
  },
};

const ServiceCard = ({ service }: { service: Service }) => {
  const [expanded, setExpanded] = useState(false);
  const styles = tierStyles[service.tier];
  const Icon = service.icon;

  return (
    <article
      className={`relative flex flex-col border ${styles.border} ${styles.panel} p-6 md:p-8 transition-shadow duration-300 hover:gold-glow`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <span
          className={`inline-flex items-center border px-2 py-0.5 text-[10px] font-brand tracking-[0.2em] ${styles.badge}`}
        >
          {service.tierLabel.toUpperCase()}
        </span>
        <Icon className="w-9 h-9 text-gold shrink-0 stroke-[1.2]" aria-hidden />
      </div>

      <h3 className="font-brand text-gold text-lg md:text-xl tracking-[0.12em] mb-2">
        {service.title.toUpperCase()}
      </h3>

      <p className="font-brand text-gold-light text-sm tracking-wide mb-3">
        {service.priceRange}
      </p>

      <p className="text-foreground/80 text-sm font-body leading-relaxed mb-4">
        {service.shortDescription}
      </p>

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center gap-2 text-xs font-brand tracking-[0.14em] text-gold hover:text-gold-light mb-4 text-left"
        aria-expanded={expanded}
      >
        <ChevronDown
          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
        {expanded ? "Hide details" : "View full description"}
      </button>

      {expanded ? (
        <p className="text-foreground/70 text-sm font-body leading-relaxed mb-4 border-l border-gold/30 pl-3">
          {service.longDescription}
        </p>
      ) : null}

      <div className="mb-5">
        <h4 className="font-brand text-gold/90 text-[10px] tracking-[0.18em] mb-2">
          EVENT TYPES
        </h4>
        <ul className="space-y-1.5">
          {service.eventTypes.map((item) => (
            <li
              key={item}
              className="text-foreground/65 text-xs font-body flex gap-2 leading-snug"
            >
              <span className="text-gold shrink-0 mt-0.5">✦</span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href="/#contacto"
          className="btn-outline-gold font-brand text-xs text-center justify-center flex-1"
        >
          Consultar
        </Link>
        <Link
          href={service.path}
          className="inline-flex items-center justify-center border border-gold/30 px-4 py-3 text-xs font-brand tracking-[0.14em] text-foreground/80 hover:border-gold hover:text-gold transition-colors flex-1 text-center"
        >
          Ver más
        </Link>
      </div>
    </article>
  );
};

const ServicesSection = () => {
  return (
    <section id="services" className="bg-background py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <p className="font-script text-gold text-center text-3xl md:text-4xl mb-4">
          Dance is the hidden language of the soul.
          <span className="inline-block w-2 h-2 rounded-full bg-gold-light ml-2 align-middle" />
        </p>

        <h2 className="font-brand text-gold text-center text-xs md:text-sm tracking-[0.28em] mb-2">
          SERVICE CATALOG
        </h2>
        <p className="text-center text-foreground/60 text-sm font-body max-w-2xl mx-auto mb-12">
          Three tiers of experience—from intimate galas to fully bespoke productions. Each level
          includes different scope, production depth, and pricing transparency.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-0 lg:divide-x lg:divide-gold/20">
          {services.map((service) => (
            <div key={service.title} className="lg:px-4 first:lg:pl-0 last:lg:pr-0">
              <ServiceCard service={service} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
