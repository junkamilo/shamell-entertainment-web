"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { hhmmToMinutes, hhmmToParts, partsToHHMM } from "@/components/contact/contactLogisticsUtils";

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function formatClampHint(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  const d = new Date();
  d.setHours(h24, m, 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

type Props = {
  isOpen: boolean;
  title: string;
  value: string;
  onClose: () => void;
  onConfirm: (hhmm: string) => void;
  /** Minutes from midnight (24h); inclusive — from weekly availability for the chosen date. */
  timeClamp?: { minMinutes: number; maxMinutes: number };
  /** Occupied windows from existing bookings (inclusive). */
  blockedRanges?: Array<{ startMinutes: number; endMinutes: number }>;
};

export default function ContactTimePickerModal({
  isOpen,
  title,
  value,
  onClose,
  onConfirm,
  timeClamp,
  blockedRanges,
}: Props) {
  const initial = useMemo(() => hhmmToParts(value), [value]);
  const [h12, setH12] = useState(initial.h12);
  const [min, setMin] = useState(initial.min);
  const [ap, setAp] = useState<"AM" | "PM">(initial.ap);
  const [clampError, setClampError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const p = hhmmToParts(value);
    setH12(p.h12);
    setMin(p.min);
    setAp(p.ap);
  }, [isOpen, value]);

  useEffect(() => {
    if (!isOpen) setClampError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  const preview = partsToHHMM(h12, min, ap);
  const d = new Date();
  const [hs, ms] = preview.split(":");
  d.setHours(Number(hs), Number(ms), 0, 0);
  const usLabel = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const previewMinutes = hhmmToMinutes(preview);
  const isBlockedByBooking =
    previewMinutes !== null &&
    (blockedRanges ?? []).some((r) => previewMinutes >= r.startMinutes && previewMinutes <= r.endMinutes);

  const selectClass =
    "shamell-time-select mt-2 w-full rounded-xl border border-gold/35 bg-shamell-surface-overlay px-3 py-2.5 font-body text-sm text-foreground outline-none [color-scheme:dark] focus:border-gold";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-[color-mix(in_srgb,var(--shamell-night)_74%,transparent)] px-4 py-8 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-time-picker-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl border border-gold/35 bg-[linear-gradient(165deg,rgba(31,10,46,0.94)_0%,rgba(23,8,36,0.98)_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.72)] backdrop-blur-[14px]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full border border-gold/25 bg-gold/5 p-2 text-gold/90 transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="border-b border-gold/18 px-5 py-4 pr-14">
          <p
            id="contact-time-picker-title"
            className="font-brand text-[10px] tracking-[0.22em] text-gold/95 uppercase"
          >
            {title}
          </p>
          <p
            className={cn(
              "mt-2 font-body text-lg tracking-wide",
              isBlockedByBooking ? "text-foreground/50" : "text-gold-light",
            )}
          >
            {usLabel}
          </p>
          <p className="mt-1 text-[10px] text-foreground/65 font-body">US format · 12-hour clock</p>
        </div>

        {clampError ? (
          <p className="px-5 pb-0 pt-2 font-body text-xs text-red-300/90">{clampError}</p>
        ) : null}
        {!clampError && isBlockedByBooking ? (
          <p className="px-5 pb-0 pt-2 font-body text-xs text-foreground/65">
            This time is already booked. Choose another available slot.
          </p>
        ) : null}

        <div className="grid grid-cols-3 gap-3 px-5 py-5">
          <label className="block">
            <span className="font-brand text-[9px] tracking-[0.16em] text-gold/80">HOUR</span>
            <select value={h12} onChange={(e) => setH12(Number(e.target.value))} className={selectClass}>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-brand text-[9px] tracking-[0.16em] text-gold/80">MINUTE</span>
            <select value={min} onChange={(e) => setMin(Number(e.target.value))} className={selectClass}>
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {String(m).padStart(2, "0")}
                </option>
              ))}
            </select>
          </label>
          <div className="block">
            <span className="font-brand text-[9px] tracking-[0.16em] text-gold/80">PERIOD</span>
            <div
              className={cn(
                "mt-2 grid grid-cols-2 gap-1 rounded-xl border border-gold/25 bg-shamell-surface-overlay p-1",
              )}
            >
              {(["AM", "PM"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAp(p)}
                  className={cn(
                    "rounded-lg py-2 font-brand text-[10px] tracking-[0.14em] transition-colors",
                    ap === p ? "bg-gold/20 text-gold" : "text-foreground/55 hover:text-gold/90",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gold/18 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gold/30 px-4 py-2.5 font-brand text-[10px] tracking-[0.14em] text-foreground/75 uppercase transition hover:border-gold/50 hover:text-gold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const hhmm = partsToHHMM(h12, min, ap);
              if (timeClamp) {
                const m = hhmmToMinutes(hhmm);
                if (m === null || m < timeClamp.minMinutes || m > timeClamp.maxMinutes) {
                  setClampError(
                    `Choose a time between ${formatClampHint(timeClamp.minMinutes)} and ${formatClampHint(timeClamp.maxMinutes)}.`,
                  );
                  return;
                }
              }
              const m = hhmmToMinutes(hhmm);
              if (
                m !== null &&
                (blockedRanges ?? []).some((r) => m >= r.startMinutes && m <= r.endMinutes)
              ) {
                setClampError("That time is already booked. Choose another time.");
                return;
              }
              setClampError(null);
              onConfirm(hhmm);
              onClose();
            }}
            disabled={isBlockedByBooking}
            className="rounded-xl border border-gold/40 bg-gold/12 px-5 py-2.5 font-brand text-[10px] tracking-[0.14em] text-gold uppercase transition hover:bg-gold/22 disabled:cursor-not-allowed disabled:border-gold/20 disabled:bg-gold/5 disabled:text-foreground/45"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
