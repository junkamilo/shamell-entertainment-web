"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

export type ShamellCountdownProps = {
  targetAt: string | Date;
  label?: string;
  className?: string;
  size?: "sm" | "md";
  onComplete?: () => void;
};

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  complete: boolean;
};

function parseTarget(targetAt: string | Date): number {
  const ms = targetAt instanceof Date ? targetAt.getTime() : Date.parse(targetAt);
  return Number.isFinite(ms) ? ms : NaN;
}

function computeParts(targetMs: number, nowMs: number): CountdownParts {
  const diff = targetMs - nowMs;
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, complete: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, complete: false };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function CountdownUnit({
  value,
  label,
  compact,
}: {
  value: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1">
      <span
        className={cn(
          "font-brand font-semibold tabular-nums tracking-[0.12em] text-gold",
          compact ? "text-lg" : "text-2xl md:text-3xl",
        )}
      >
        {value}
      </span>
      <span className="text-[9px] font-medium uppercase tracking-[0.18em] text-foreground/50 md:text-[10px]">
        {label}
      </span>
    </div>
  );
}

export function ShamellCountdown({
  targetAt,
  label = "Event begins in",
  className,
  size = "md",
  onComplete,
}: ShamellCountdownProps) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const targetMs = useMemo(() => parseTarget(targetAt), [targetAt]);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!Number.isFinite(targetMs)) return;
    const intervalMs = prefersReducedMotion ? 60_000 : 1_000;
    const id = window.setInterval(() => setNowMs(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [targetMs, prefersReducedMotion]);

  const parts = useMemo(
    () => (Number.isFinite(targetMs) ? computeParts(targetMs, nowMs) : null),
    [targetMs, nowMs],
  );

  useEffect(() => {
    if (parts?.complete) onComplete?.();
  }, [parts?.complete, onComplete]);

  if (!parts || !Number.isFinite(targetMs)) return null;

  if (parts.complete) {
    return (
      <div
        className={cn(
          "rounded-xl border border-gold/15 bg-black/40 px-4 py-3 text-center",
          className,
        )}
        role="status"
      >
        <p className="font-body text-xs text-foreground/45 md:text-sm">Event day</p>
      </div>
    );
  }

  const compact = size === "sm";
  const sepClass = cn("text-gold/35", compact ? "text-sm" : "text-base");

  return (
    <div
      className={cn(
        "rounded-xl border border-gold/20 bg-black/40",
        compact ? "px-3 py-2.5" : "px-4 py-3.5 md:px-5 md:py-4",
        className,
      )}
      role="timer"
      aria-live="polite"
    >
      {label ? (
        <p
          className={cn(
            "mb-2 text-center font-brand uppercase tracking-[0.14em] text-foreground/55",
            compact ? "text-[9px]" : "text-[10px] md:text-xs",
          )}
        >
          {label}
        </p>
      ) : null}
      <div className="flex items-center justify-center gap-2 md:gap-3">
        <CountdownUnit value={String(parts.days)} label="Days" compact={compact} />
        <span className={sepClass} aria-hidden>
          ·
        </span>
        <CountdownUnit value={pad(parts.hours)} label="Hours" compact={compact} />
        <span className={sepClass} aria-hidden>
          ·
        </span>
        <CountdownUnit value={pad(parts.minutes)} label="Min" compact={compact} />
        {!prefersReducedMotion ? (
          <>
            <span className={sepClass} aria-hidden>
              ·
            </span>
            <CountdownUnit value={pad(parts.seconds)} label="Sec" compact={compact} />
          </>
        ) : null}
      </div>
    </div>
  );
}

export function isFutureEventStart(eventStartsAt: string | null | undefined): boolean {
  if (!eventStartsAt) return false;
  const ms = Date.parse(eventStartsAt);
  return Number.isFinite(ms) && ms > Date.now();
}
