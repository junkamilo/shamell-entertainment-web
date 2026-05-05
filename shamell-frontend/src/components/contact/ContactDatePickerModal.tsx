"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  parseISOLocal,
  startOfTodayLocal,
  toISOLocalDate,
} from "@/components/contact/contactLogisticsUtils";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function monthHasSelectableDays(year: number, month0: number, min: Date): boolean {
  const dim = new Date(year, month0 + 1, 0).getDate();
  return new Date(year, month0, dim) >= min;
}

type Props = {
  isOpen: boolean;
  title: string;
  value: string;
  onClose: () => void;
  onConfirm: (iso: string) => void;
};

export default function ContactDatePickerModal({ isOpen, title, value, onClose, onConfirm }: Props) {
  const minDate = useMemo(() => startOfTodayLocal(), []);
  const [viewYear, setViewYear] = useState(() => minDate.getFullYear());
  const [viewMonth0, setViewMonth0] = useState(() => minDate.getMonth());
  const [picked, setPicked] = useState<Date | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const initial = value ? parseISOLocal(value) : null;
    const validInitial = initial && initial >= minDate ? initial : minDate;
    setPicked(validInitial);
    setViewYear(validInitial.getFullYear());
    setViewMonth0(validInitial.getMonth());
  }, [isOpen, value, minDate]);

  if (!isOpen) return null;

  const first = new Date(viewYear, viewMonth0, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(viewYear, viewMonth0 + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isDisabledDay = (day: number) => {
    const dt = new Date(viewYear, viewMonth0, day);
    return dt < minDate;
  };

  const selectDay = (day: number) => {
    if (isDisabledDay(day)) return;
    setPicked(new Date(viewYear, viewMonth0, day));
  };

  const monthLabel = new Date(viewYear, viewMonth0, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonthDate = new Date(viewYear, viewMonth0 - 1, 1);
  const prevDisabled = !monthHasSelectableDays(
    prevMonthDate.getFullYear(),
    prevMonthDate.getMonth(),
    minDate,
  );

  const goPrevMonth = () => {
    if (prevDisabled) return;
    setViewYear(prevMonthDate.getFullYear());
    setViewMonth0(prevMonthDate.getMonth());
  };

  const goNextMonth = () => {
    const d = new Date(viewYear, viewMonth0 + 1, 1);
    setViewYear(d.getFullYear());
    setViewMonth0(d.getMonth());
  };

  const pickedOk = picked !== null && picked >= minDate;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-8 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-date-picker-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-gold/35 bg-[linear-gradient(165deg,rgba(18,15,10,0.98)_0%,rgba(6,5,4,1)_100%)] shadow-[0_28px_90px_rgba(0,0,0,0.72)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full border border-gold/25 p-2 text-gold/80 transition hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>

        <div className="border-b border-gold/18 px-5 py-4 pr-14">
          <p
            id="contact-date-picker-title"
            className="font-brand text-[10px] tracking-[0.22em] text-gold/95 uppercase"
          >
            {title}
          </p>
          <div className="mt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={goPrevMonth}
              disabled={prevDisabled}
              className="rounded-lg border border-gold/30 p-2 text-gold transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-25"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-brand text-sm tracking-[0.14em] text-gold text-center">{monthLabel}</span>
            <button
              type="button"
              onClick={goNextMonth}
              className="rounded-lg border border-gold/30 p-2 text-gold transition hover:bg-gold/10"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="px-5 py-4">
          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-2 text-[10px] font-brand tracking-[0.14em] text-gold/55">
                {w}
              </div>
            ))}
            {cells.map((day, idx) =>
              day === null ? (
                <div key={`e-${idx}`} className="aspect-square" />
              ) : (
                <button
                  key={`${viewYear}-${viewMonth0}-${day}`}
                  type="button"
                  disabled={isDisabledDay(day)}
                  onClick={() => selectDay(day)}
                  className={cn(
                    "aspect-square rounded-lg border text-sm font-body transition-colors",
                    isDisabledDay(day) && "cursor-not-allowed border-transparent text-foreground/20",
                    !isDisabledDay(day) &&
                      picked &&
                      picked.getFullYear() === viewYear &&
                      picked.getMonth() === viewMonth0 &&
                      picked.getDate() === day &&
                      "border-gold bg-gold/20 text-gold-light",
                    !isDisabledDay(day) &&
                      (!picked ||
                        picked.getFullYear() !== viewYear ||
                        picked.getMonth() !== viewMonth0 ||
                        picked.getDate() !== day) &&
                      "border-gold/15 text-foreground/85 hover:border-gold/45 hover:bg-gold/10",
                  )}
                >
                  {day}
                </button>
              ),
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gold/18 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gold/30 px-4 py-2.5 font-brand text-[10px] tracking-[0.14em] text-foreground/75 uppercase transition hover:border-gold/50 hover:text-gold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!pickedOk}
            onClick={() => {
              if (pickedOk && picked) {
                onConfirm(toISOLocalDate(picked));
                onClose();
              }
            }}
            className="rounded-xl border border-gold/40 bg-gold/12 px-5 py-2.5 font-brand text-[10px] tracking-[0.14em] text-gold uppercase transition hover:bg-gold/22 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
