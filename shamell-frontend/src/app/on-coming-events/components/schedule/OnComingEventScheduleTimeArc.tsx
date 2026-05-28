"use client";

import { useRef } from "react";
import { Clock } from "lucide-react";
import { motion, useInView } from "motion/react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import type { ScheduleViewModel } from "../../lib/parseScheduleViewModel";

const CX = 120;
const CY = 108;
const R = 88;

/** Map minutes 0–1440 to angle on lower semicircle (180° left → 360° right). */
function minutesToAngle(minutes: number): number {
  const clamped = Math.max(0, Math.min(1440, minutes));
  const t = clamped / 1440;
  return Math.PI + t * Math.PI;
}

function polarToXY(angle: number, radius = R): { x: number; y: number } {
  return {
    x: CX + radius * Math.cos(angle),
    y: CY + radius * Math.sin(angle),
  };
}

function describeArc(startMin: number, endMin: number): string {
  const startAngle = minutesToAngle(startMin);
  const endAngle = minutesToAngle(endMin);
  const start = polarToXY(startAngle);
  const end = polarToXY(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function describeTrack(): string {
  const left = polarToXY(Math.PI);
  const right = polarToXY(2 * Math.PI);
  return `M ${left.x} ${left.y} A ${R} ${R} 0 0 1 ${right.x} ${right.y}`;
}

type Props = {
  model: ScheduleViewModel;
};

export function OnComingEventScheduleTimeArc({ model }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const hasTime =
    model.startMinutes != null &&
    model.endMinutes != null &&
    model.endMinutes > model.startMinutes;

  const trackPath = describeTrack();
  const activePath =
    hasTime ? describeArc(model.startMinutes!, model.endMinutes!) : "";

  const startTick = hasTime ? polarToXY(minutesToAngle(model.startMinutes!), R + 6) : null;
  const endTick = hasTime ? polarToXY(minutesToAngle(model.endMinutes!), R + 6) : null;

  return (
    <div ref={ref} className="flex flex-col items-center" aria-label="Event time">
      <p className="mb-4 self-start font-brand text-xs tracking-[0.14em] text-gold/80">TIME</p>

      {!hasTime ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="mb-3 h-12 w-12 text-gold/25" strokeWidth={1.2} aria-hidden />
          <p className="font-body text-sm text-foreground/60">Time to be announced</p>
        </div>
      ) : (
        <>
          <div className="relative w-full max-w-[240px]">
            <svg
              viewBox="0 0 240 140"
              className="w-full overflow-visible"
              role="img"
              aria-label={`${model.timeRangeLabel}${model.durationLabel ? `, duration ${model.durationLabel}` : ""}`}
            >
              <defs>
                <linearGradient id="scheduleTimeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(197,165,90,0.35)" />
                  <stop offset="100%" stopColor="rgba(197,165,90,0.95)" />
                </linearGradient>
              </defs>
              <path
                d={trackPath}
                fill="none"
                stroke="rgba(197,165,90,0.15)"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <motion.path
                d={activePath}
                fill="none"
                stroke="url(#scheduleTimeGrad)"
                strokeWidth="10"
                strokeLinecap="round"
                initial={
                  prefersReducedMotion ?
                    { pathLength: 1, opacity: 1 }
                  : { pathLength: 0, opacity: 0.6 }
                }
                animate={
                  isInView ?
                    { pathLength: 1, opacity: 1 }
                  : prefersReducedMotion ?
                    { pathLength: 1 }
                  : { pathLength: 0, opacity: 0.6 }
                }
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={prefersReducedMotion ? undefined : { strokeWidth: 12 }}
              />
              {startTick ? (
                <circle cx={startTick.x} cy={startTick.y} r="4" fill="rgba(197,165,90,0.9)" />
              ) : null}
              {endTick ? (
                <circle cx={endTick.x} cy={endTick.y} r="4" fill="rgba(197,165,90,0.9)" />
              ) : null}
            </svg>

            <div className="pointer-events-none absolute inset-x-0 bottom-2 flex flex-col items-center text-center">
              {model.durationLabel ? (
                <span className="font-display text-2xl text-gold">{model.durationLabel}</span>
              ) : null}
              <span
                className={cn(
                  "font-body text-sm text-foreground/88",
                  model.durationLabel ? "mt-0.5" : "mt-2 text-base",
                )}
              >
                {model.timeRangeLabel}
              </span>
            </div>
          </div>

          <div className="mt-2 flex w-full max-w-[240px] justify-between text-[10px] text-foreground/50">
            <span>12 AM</span>
            <span>12 PM</span>
            <span>12 AM</span>
          </div>
        </>
      )}
    </div>
  );
}
