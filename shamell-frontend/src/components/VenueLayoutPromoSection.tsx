"use client";

import Image from "next/image";
import Link from "next/link";
import { useVenueLayoutSettings } from "@/hooks/use-venue-layout-settings";
import { VENUE_LAYOUT_PUBLIC_PATH } from "@/app/shamell-admin/venue-layout-promo/lib/venueLayoutPromoRoutes";

export default function VenueLayoutPromoSection() {
  const { clientEnabled, promo, isLoading } = useVenueLayoutSettings();

  if (isLoading || !clientEnabled) return null;

  const title = promo.promoTitle?.trim() || "Explore our venue";
  const description =
    promo.promoDescription?.trim() ||
    "View the interactive floor plan and choose your table for an unforgettable evening.";

  return (
    <section id="venue-layout" className="bg-transparent px-4 py-20 md:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-14">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-gold/20 shadow-[0_12px_48px_rgba(0,0,0,0.45)]">
          {promo.promoImageUrl ? (
            <Image
              src={promo.promoImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-black/50 text-sm text-foreground/50">
              Venue floor plan
            </div>
          )}
        </div>
        <div>
          <p className="font-brand text-xs tracking-[0.2em] text-gold/90">VENUE LAYOUT</p>
          <h2 className="mt-3 font-display text-3xl text-gold md:text-4xl">{title}</h2>
          <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/82 md:text-base">
            {description}
          </p>
          <Link
            href={VENUE_LAYOUT_PUBLIC_PATH}
            className="mt-8 inline-flex rounded-lg border border-gold/45 bg-gold/10 px-6 py-3 font-brand text-xs font-semibold uppercase tracking-[0.14em] text-gold transition hover:bg-gold/20"
          >
            Explore the floor plan
          </Link>
        </div>
      </div>
    </section>
  );
}
