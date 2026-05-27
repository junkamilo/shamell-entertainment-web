"use client";

import Image from "next/image";
import type { VenueLayoutClientSettings } from "../types/venueLayoutPromo.types";

type Props = {
  settings: VenueLayoutClientSettings;
  onEdit: () => void;
  /** Omit outer padding when rendered inside a module section. */
  embedded?: boolean;
};

export function VenueLayoutPromoPreview({ settings, onEdit, embedded = false }: Props) {
  return (
    <div
      className={
        embedded ? "grid gap-8 md:grid-cols-2" : "grid gap-8 p-5 md:grid-cols-2 md:p-8"
      }
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-gold/12 bg-black/40">
        {settings.promoImageUrl ? (
          <Image
            src={settings.promoImageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-foreground/45">
            No promo image yet
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <h3 className="font-display text-2xl text-gold">
          {settings.promoTitle?.trim() || "Venue layout"}
        </h3>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
          {settings.promoDescription?.trim() ||
            "Add a title and description to promote the interactive floor plan on the home page."}
        </p>
        <button
          type="button"
          onClick={onEdit}
          className="mt-6 self-start rounded-lg border border-gold/35 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gold hover:bg-gold/10"
        >
          Edit promo content
        </button>
      </div>
    </div>
  );
}
