"use client";

import { cn } from "@/lib/utils";
import type { VenueSeatingSection } from "../types/venueSeatingSection";

type Props = {
  value: VenueSeatingSection;
  onChange: (section: VenueSeatingSection) => void;
};

const TABS: { id: VenueSeatingSection; label: string }[] = [
  { id: "tables", label: "Tables" },
  { id: "chairs", label: "Standalone chairs" },
];

export default function VenueSeatingSectionTabs({ value, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Table seating sections"
      className="flex rounded-xl border border-gold/18 bg-black/20 p-1"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-lg px-4 py-2.5 font-brand text-[10px] tracking-[0.12em] transition sm:px-5",
            value === tab.id
              ? "bg-gold/12 text-gold shadow-inner"
              : "text-foreground/50 hover:text-foreground/80",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
