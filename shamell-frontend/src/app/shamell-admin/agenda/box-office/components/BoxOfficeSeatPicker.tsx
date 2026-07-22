"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { formatPriceEn } from "@/lib/pricing";
import type {
  BoxOfficeSeatOption,
  BoxOfficeTableSize,
} from "../types/boxOfficeFixed.types";

type SeatCategory = "tables" | "chairs";

type Props = {
  seats: BoxOfficeSeatOption[];
  selectedSeatId: string | null;
  onSelect: (layoutItemId: string | null) => void;
  loading: boolean;
};

const TABLE_SIZES: BoxOfficeTableSize[] = ["LARGE", "MEDIUM", "SMALL"];

const pillActive =
  "rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5";
const pillIdle =
  "rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5";

function emptyMessage(
  category: SeatCategory,
  tableSize: BoxOfficeTableSize,
): string {
  if (category === "chairs") {
    return "No chairs on the floor layout for this event.";
  }
  const label =
    tableSize === "LARGE"
      ? "Large"
      : tableSize === "MEDIUM"
        ? "Medium"
        : "Small";
  return `No ${label} tables on the floor layout for this event.`;
}

export function BoxOfficeSeatPicker({
  seats,
  selectedSeatId,
  onSelect,
  loading,
}: Props) {
  const [category, setCategory] = useState<SeatCategory>("tables");
  const [tableSize, setTableSize] = useState<BoxOfficeTableSize>("LARGE");

  useEffect(() => {
    setCategory("tables");
    setTableSize("LARGE");
  }, [seats]);

  const filtered = useMemo(() => {
    if (category === "chairs") {
      return seats.filter((s) => s.kind === "standalone_chair");
    }
    return seats.filter(
      (s) => s.kind === "catalog_table" && s.tableSize === tableSize,
    );
  }, [seats, category, tableSize]);

  useEffect(() => {
    if (!selectedSeatId) return;
    if (!filtered.some((s) => s.layoutItemId === selectedSeatId)) {
      onSelect(null);
    }
  }, [filtered, selectedSeatId, onSelect]);

  if (loading) {
    return (
      <p className="text-sm text-foreground/60">Loading tables and chairs…</p>
    );
  }

  if (seats.length === 0) {
    return (
      <p className="text-sm text-foreground/60">
        No tables or chairs on the floor layout for this event.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setCategory("tables")}
          className={category === "tables" ? pillActive : pillIdle}
        >
          TABLES
        </button>
        <button
          type="button"
          onClick={() => setCategory("chairs")}
          className={category === "chairs" ? pillActive : pillIdle}
        >
          CHAIRS
        </button>
      </div>

      {category === "tables" ? (
        <div className="flex flex-wrap items-center gap-2">
          {TABLE_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setTableSize(size)}
              className={tableSize === size ? pillActive : pillIdle}
            >
              {size === "LARGE"
                ? "LARGE"
                : size === "MEDIUM"
                  ? "MEDIUM"
                  : "SMALL"}
            </button>
          ))}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <p className="text-sm text-foreground/60">
          {emptyMessage(category, tableSize)}
        </p>
      ) : (
        <div className="grid w-full gap-2 sm:grid-cols-2">
          {filtered.map((seat) => {
            const blocked = seat.reserved || seat.pending;
            const selected = selectedSeatId === seat.layoutItemId;
            return (
              <button
                key={seat.layoutItemId}
                type="button"
                disabled={blocked}
                onClick={() => onSelect(seat.layoutItemId)}
                className={cn(
                  "rounded-xl border px-4 py-3 text-left transition",
                  blocked &&
                    "cursor-not-allowed border-foreground/10 bg-foreground/5 opacity-45",
                  !blocked &&
                    !selected &&
                    "border-gold/25 bg-black/25 hover:border-gold/45",
                  selected && "border-gold/50 bg-gold/15",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-brand text-sm tracking-wide text-gold">
                    {seat.seatLabel}
                  </span>
                  {blocked ? (
                    <span className="font-brand text-[10px] tracking-[0.12em] text-foreground/50">
                      {seat.reserved ? "RESERVED" : "PENDING"}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-foreground/65">{seat.detail}</p>
                <p className="mt-2 text-sm text-gold/90">
                  {seat.amount != null ? formatPriceEn(seat.amount) : "—"}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
