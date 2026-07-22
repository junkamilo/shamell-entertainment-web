"use client";

import { FileText, Pencil } from "lucide-react";
import { formatRelativeEn } from "@/features/admin/about/lib/aboutAdminUtils";
import type { VenueLayoutClientSettings } from "../types/venueLayoutPromo.types";

type Props = {
  settings: VenueLayoutClientSettings;
  onEdit: () => void;
  /** Omit outer padding when rendered inside a module section. */
  embedded?: boolean;
};

export function VenueLayoutPromoPreview({ settings, onEdit, embedded = false }: Props) {
  const title = settings.promoTitle?.trim() || "ON COMING EVENTS";
  const description =
    settings.promoDescription?.trim() ||
    "Discover on coming experiences curated by Shamell. View details, schedules, and book your place.";

  return (
    <div className={embedded ? "" : "p-5 md:p-8"}>
      <div className="shamell-glass-surface overflow-hidden rounded-xl border border-gold/15">
        <div className="border-b border-gold/10 px-6 py-4 md:px-8">
          <p className="font-brand text-[10px] tracking-[0.28em] text-gold/70">HOME SECTION TITLE</p>
          <h3 className="mt-2 font-brand text-2xl tracking-[0.08em] text-gold md:text-3xl">{title}</h3>
        </div>

        <div className="px-6 py-6 md:px-8">
          <p className="font-brand text-[10px] tracking-[0.28em] text-gold/70">HOME SECTION DESCRIPTION</p>
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-gold/12 bg-black/20 p-4">
            <FileText className="mt-0.5 h-5 w-5 shrink-0 text-gold/50" strokeWidth={1.4} />
            <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-foreground/75">
              {description}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-gold/10 pt-6">
            <p className="font-body text-xs text-foreground/45">
              Last edited: {formatRelativeEn(settings.updatedAt ?? undefined)}
            </p>
            <button
              type="button"
              onClick={onEdit}
              className="ml-auto inline-flex items-center gap-2 rounded-xl border border-gold/35 bg-gold/12 px-5 py-2.5 font-brand text-xs tracking-[0.12em] text-gold transition hover:bg-gold/20"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.5} />
              Edit home section
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
