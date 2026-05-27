"use client";

import Link from "next/link";
import { ExternalLink, LayoutGrid } from "lucide-react";
import { FLOOR_LAYOUT_PATH } from "@/app/shamell-admin/floor-layout/lib/floorLayoutRoutes";
import { VENUE_LAYOUT_PUBLIC_PATH } from "../lib/venueLayoutPromoRoutes";

type Props = {
  clientEnabled: boolean;
  isToggling: boolean;
  onToggle: () => void;
  /** Nested inside a parent module section (no extra card chrome). */
  embedded?: boolean;
};

export function VenueLayoutPublishCard({
  clientEnabled,
  isToggling,
  onToggle,
  embedded = false,
}: Props) {
  return (
    <div className={embedded ? undefined : "shamell-glass-surface mb-6 rounded-2xl border border-gold/14 p-5 md:p-6"}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-brand text-sm tracking-[0.16em] text-gold">Public site</h2>
          <p className="mt-2 max-w-xl text-sm text-foreground/75">
            When enabled, clients see a header link, a home promo block, and the interactive 3D floor
            plan.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={clientEnabled}
          disabled={isToggling}
          onClick={() => void onToggle()}
          className={`relative inline-flex h-9 w-[4.5rem] shrink-0 items-center rounded-full border transition-colors disabled:opacity-50 ${
            clientEnabled
              ? "border-gold/50 bg-gold/25"
              : "border-gold/20 bg-black/30"
          }`}
        >
          <span
            className={`inline-block h-7 w-7 rounded-full bg-gold shadow transition-transform ${
              clientEnabled ? "translate-x-8" : "translate-x-1"
            }`}
          />
          <span className="sr-only">Publish venue layout on client site</span>
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <span
          className={`rounded-full px-3 py-1 font-semibold uppercase tracking-wider ${
            clientEnabled
              ? "bg-emerald-900/40 text-emerald-300"
              : "bg-foreground/10 text-foreground/55"
          }`}
        >
          {clientEnabled ? "Live on site" : "Hidden"}
        </span>
        <Link
          href={FLOOR_LAYOUT_PATH}
          className="inline-flex items-center gap-1 text-gold hover:underline"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Edit 3D croquis
        </Link>
        {clientEnabled ? (
          <a
            href={VENUE_LAYOUT_PUBLIC_PATH}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-gold hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Preview public page
          </a>
        ) : null}
      </div>
    </div>
  );
}
