"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import ShamellTime12hColumns from "@/components/ShamellTime12hColumns";
import {
  format12hPeriodHint,
  formatMinutesAsTimeDisplayUs,
  formatPartsDisplayUs,
  hhmmToMinutes,
  hhmmToParts,
  partsToHHMM,
  snapToNearestSelectableParts,
} from "@/lib/contactLogisticsUtils";

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
  /** Overlay z-index when stacking above another modal. */
  overlayZClass?: string;
};

export default function ContactTimePickerModal({
  isOpen,
  title,
  value,
  onClose,
  onConfirm,
  timeClamp,
  blockedRanges,
  overlayZClass = "z-[100]",
}: Props) {
  const [mounted, setMounted] = useState(false);
  const initial = useMemo(() => hhmmToParts(value), [value]);
  const [h12, setH12] = useState(initial.h12);
  const [min, setMin] = useState(initial.min);
  const [ap, setAp] = useState<"AM" | "PM">(initial.ap);
  const [clampError, setClampError] = useState<string | null>(null);
  const selectionRef = useRef({ h12: initial.h12, min: initial.min, ap: initial.ap as "AM" | "PM" });
  const openedForValueRef = useRef<string | null>(null);

  useEffect(() => {
    selectionRef.current = { h12, min, ap };
  }, [h12, min, ap]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      openedForValueRef.current = null;
      return;
    }
    const valueChangedWhileOpen = openedForValueRef.current !== value;
    openedForValueRef.current = value;

    const base = valueChangedWhileOpen
      ? hhmmToParts(value)
      : { ...selectionRef.current };
    const snapped = snapToNearestSelectableParts(base.h12, base.min, base.ap, timeClamp, blockedRanges);
    setH12(snapped.h12);
    setMin(snapped.min);
    setAp(snapped.ap);
  }, [isOpen, value, timeClamp, blockedRanges]);

  useEffect(() => {
    if (!isOpen) setClampError(null);
  }, [isOpen]);

  const preview = partsToHHMM(h12, min, ap);
  const usLabel = formatPartsDisplayUs(h12, min, ap);
  const periodHint = format12hPeriodHint(h12, ap);
  const previewMinutes = hhmmToMinutes(preview);
  const isBlockedByBooking =
    previewMinutes !== null &&
    (blockedRanges ?? []).some((r) => previewMinutes >= r.startMinutes && previewMinutes <= r.endMinutes);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="contact-time-picker-overlay"
          className={cn(
            "admin-theme fixed inset-0 flex items-center justify-center bg-shamell-night/90 px-4 py-8 backdrop-blur-sm",
            overlayZClass,
          )}
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="contact-time-picker-title"
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-gold/35 bg-shamell-surface-deep text-foreground shadow-2xl"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { type: "spring", damping: 28, stiffness: 340, mass: 0.85 },
            }}
            exit={{
              opacity: 0,
              scale: 0.97,
              y: 10,
              transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-gold/25 text-foreground/80 transition hover:bg-gold/10 hover:text-gold"
              aria-label="Close"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>

            <div className="border-b border-gold/20 bg-[#1f0a2e] px-5 py-5 pr-16">
              <p
                id="contact-time-picker-title"
                className="font-brand text-xs tracking-[0.22em] text-gold/95 uppercase"
              >
                {title}
              </p>
              <motion.p
                key={preview}
                initial={{ opacity: 0.65 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  "mt-2 font-body text-xl tracking-wide sm:text-2xl",
                  isBlockedByBooking ? "text-foreground/50" : "text-gold-light",
                )}
              >
                {usLabel}
              </motion.p>
              {periodHint ? (
                <p className="mt-1 font-body text-xs text-gold/80">{periodHint}</p>
              ) : null}
              <p className="mt-1 font-body text-xs text-foreground/65">
                US format · 12-hour clock · always includes AM or PM
              </p>
            </div>

            {clampError ? (
              <p className="px-5 pb-0 pt-2 font-body text-xs text-red-300/90">{clampError}</p>
            ) : null}
            {!clampError && isBlockedByBooking ? (
              <p className="px-5 pb-0 pt-2 font-body text-xs text-foreground/65">
                This time is already booked. Choose another available slot.
              </p>
            ) : null}

            <ShamellTime12hColumns
              className="bg-shamell-surface-deep px-5 py-5"
              value={{ h12, min, ap }}
              onChange={(next) => {
                setH12(next.h12);
                setMin(next.min);
                setAp(next.ap);
              }}
              timeClamp={timeClamp}
              blockedRanges={blockedRanges}
            />

            <div className="flex flex-wrap justify-end gap-2 border-t border-gold/20 bg-[#1f0a2e] px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-gold/30 px-4 py-3 font-brand text-xs tracking-[0.14em] text-foreground/75 uppercase transition hover:border-gold/50 hover:text-gold"
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
                        `Choose a time between ${formatMinutesAsTimeDisplayUs(timeClamp.minMinutes)} and ${formatMinutesAsTimeDisplayUs(timeClamp.maxMinutes)}.`,
                      );
                      return;
                    }
                  }
                  const m = hhmmToMinutes(hhmm);
                  if (m !== null && (blockedRanges ?? []).some((r) => m >= r.startMinutes && m <= r.endMinutes)) {
                    setClampError("That time is already booked. Choose another time.");
                    return;
                  }
                  setClampError(null);
                  onConfirm(hhmm);
                  onClose();
                }}
                className="rounded-xl border border-gold/40 bg-gold/12 px-5 py-3 font-brand text-xs tracking-[0.14em] text-gold uppercase transition hover:bg-gold/22 disabled:cursor-not-allowed disabled:border-gold/20 disabled:bg-gold/5 disabled:text-foreground/45"
              >
                Apply
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
