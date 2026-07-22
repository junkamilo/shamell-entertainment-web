"use client";

import { cn } from "@/lib/utils";
import type { VenueLayoutPromoSectionTab } from "../types/venueLayoutPromo.types";

type Props = {
  activeTab: VenueLayoutPromoSectionTab;
  onTabChange: (tab: VenueLayoutPromoSectionTab) => void;
};

const TABS: { id: VenueLayoutPromoSectionTab; label: string }[] = [
  { id: "reservation", label: "Reservation event" },
  { id: "home-promo", label: "Home promo preview" },
];

export function VenueLayoutPromoSectionTabs({ activeTab, onTabChange }: Props) {
  return (
    <div
      className="flex gap-2 rounded-xl border border-gold/15 bg-black/20 p-1"
      role="tablist"
      aria-label="On Coming Events sections"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "flex-1 rounded-lg px-4 py-2.5 font-brand text-xs tracking-[0.12em] uppercase transition sm:tracking-[0.16em]",
            activeTab === tab.id
              ? "border border-gold/35 bg-gold/15 text-gold shadow-[0_0_20px_rgba(197,165,90,0.12)]"
              : "border border-transparent text-foreground/60 hover:bg-white/5 hover:text-foreground/85",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
