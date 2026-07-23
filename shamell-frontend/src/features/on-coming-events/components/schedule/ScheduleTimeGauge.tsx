"use client";

import { useEffect, useId, useRef, useState } from "react";
import { animate, motion, useInView, useMotionValue } from "motion/react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  formatDurationFromMinutes,
  type TimeArcSegment,
} from "../../lib/parseScheduleViewModel";

const CX = 120;
const CY = 108;
const R = 88;

const TRACK_DURATION = 0.55;
const SEGMENT_BASE_DELAY = 0.4;
const SEGMENT_STAGGER = 0.12;
const SEGMENT_DURATION = 0.85;
const COUNTER_DURATION = 0.75;

const easeLux = [0.16, 1, 0.3, 1] as const;

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

function segmentEndDelay(arcCount: number): number {
  if (arcCount <= 0) return TRACK_DURATION;
  return SEGMENT_BASE_DELAY + (arcCount - 1) * SEGMENT_STAGGER + SEGMENT_DURATION;
}

const trackVariants = {
  hidden: { pathLength: 0, opacity: 0.35 },
  visible: { pathLength: 1, opacity: 1 },
};

function segmentVariants(targetOpacity: number) {
  return {
    hidden: { pathLength: 0, opacity: targetOpacity * 0.35 },
    visible: { pathLength: 1, opacity: targetOpacity },
  };
}

export type ScheduleTimeGaugeProps = {
  arcs: TimeArcSegment[];
  durationTotalMinutes: number | null;
  durationLabel: string | null;
  timeRangeLabel: string;
  mobileSlide?: boolean;
};

export function ScheduleTimeGauge({
  arcs,
  durationTotalMinutes,
  durationLabel,
  timeRangeLabel,
  mobileSlide = false,
}: ScheduleTimeGaugeProps) {
  const gaugeRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isInView = useInView(gaugeRef, {
    once: true,
    amount: 0.45,
    margin: "0px 0px -40px 0px",
  });

  const [play, setPlay] = useState(false);
  const gradId = `schedule-time-grad-${useId().replace(/:/g, "")}`;
  const trackPath = describeTrack();
  const counterDelay = segmentEndDelay(arcs.length) * 0.5;
  const rangeDelay = segmentEndDelay(arcs.length) + 0.12;

  const motionMinutes = useMotionValue(0);
  const [displayMinutes, setDisplayMinutes] = useState(0);
  const hasCounterAnimatedRef = useRef(false);

  useEffect(() => {
    if (!isInView || play) return;
    setPlay(true);
  }, [isInView, play]);

  useEffect(() => {
    const unsub = motionMinutes.on("change", (v) => setDisplayMinutes(v));
    return unsub;
  }, [motionMinutes]);

  useEffect(() => {
    if (!play || hasCounterAnimatedRef.current) return;
    hasCounterAnimatedRef.current = true;

    if (prefersReducedMotion || durationTotalMinutes == null) {
      motionMinutes.set(durationTotalMinutes ?? 0);
      return;
    }

    motionMinutes.set(0);
    void animate(motionMinutes, durationTotalMinutes, {
      duration: COUNTER_DURATION,
      delay: counterDelay,
      ease: "easeOut",
    });
  }, [play, durationTotalMinutes, prefersReducedMotion, counterDelay, motionMinutes]);

  const animateState = play || prefersReducedMotion ? "visible" : "hidden";

  const showCounter =
    durationTotalMinutes != null && (durationLabel != null || durationTotalMinutes > 0);
  const counterText =
    prefersReducedMotion && durationLabel ?
      durationLabel
    : showCounter ?
      formatDurationFromMinutes(displayMinutes)
    : null;

  const ariaLabel = `${timeRangeLabel}${durationLabel ? `, duration ${durationLabel}` : ""}`;

  return (
    <div ref={gaugeRef} className="flex w-full flex-col items-center">
      <div
        className={cn(
          "relative w-full",
          mobileSlide ? "max-w-[280px]" : "max-w-[220px] md:max-w-[260px]",
        )}
      >
        <svg
          viewBox="0 0 240 140"
          className="w-full overflow-visible"
          role="img"
          aria-label={ariaLabel}
        >
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(197,165,90,0.35)" />
              <stop offset="100%" stopColor="rgba(197,165,90,0.95)" />
            </linearGradient>
          </defs>
          <motion.path
            d={trackPath}
            fill="none"
            stroke="rgba(197,165,90,0.15)"
            strokeWidth="10"
            strokeLinecap="round"
            pathLength={1}
            variants={trackVariants}
            initial="hidden"
            animate={animateState}
            transition={
              prefersReducedMotion ?
                { duration: 0 }
              : { duration: TRACK_DURATION, ease: easeLux }
            }
          />
          {arcs.map((arc, idx) => {
            const path = describeArc(arc.startMinutes, arc.endMinutes);
            const opacity = 0.55 + (idx / Math.max(arcs.length, 1)) * 0.45;
            const delay = SEGMENT_BASE_DELAY + idx * SEGMENT_STAGGER;
            return (
              <motion.path
                key={`${arc.startMinutes}-${arc.endMinutes}-${idx}`}
                d={path}
                fill="none"
                stroke={`url(#${gradId})`}
                strokeWidth={arcs.length > 1 ? 8 : 10}
                strokeLinecap="round"
                pathLength={1}
                variants={segmentVariants(opacity)}
                initial="hidden"
                animate={animateState}
                transition={
                  prefersReducedMotion ?
                    { duration: 0 }
                  : { duration: SEGMENT_DURATION, delay, ease: easeLux }
                }
              />
            );
          })}
        </svg>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-1 flex flex-col items-center text-center"
          aria-live="off"
        >
          {counterText ? (
            <motion.span
              className={cn(
                "font-display text-gold",
                mobileSlide ? "text-3xl" : "text-xl sm:text-2xl",
              )}
              initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.92 }}
              animate={animateState === "visible" ? { opacity: 1, scale: 1 } : { opacity: 0 }}
              transition={
                prefersReducedMotion ?
                  { duration: 0 }
                : { delay: counterDelay, duration: 0.35, ease: easeLux }
              }
            >
              {counterText}
            </motion.span>
          ) : null}
          <motion.span
            className={cn(
              "font-body text-foreground/88",
              mobileSlide ? "text-sm" : "text-xs sm:text-sm",
              counterText ? "mt-0.5" : "mt-1",
            )}
            initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
            animate={animateState === "visible" ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            transition={
              prefersReducedMotion ?
                { duration: 0 }
              : { delay: rangeDelay, duration: 0.45, ease: easeLux }
            }
          >
            {timeRangeLabel}
          </motion.span>
        </div>
      </div>

      <div
        className={cn(
          "mt-1 flex w-full justify-between text-foreground/50",
          mobileSlide ?
            "max-w-[280px] text-[11px]"
          : "max-w-[220px] text-[9px] sm:text-[10px] md:max-w-[260px]",
        )}
      >
        {(["12 AM", "12 PM", "12 AM"] as const).map((label, idx) => (
          <motion.span
            key={`${label}-${idx}`}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={animateState === "visible" ? { opacity: 1 } : { opacity: 0 }}
            transition={
              prefersReducedMotion ?
                { duration: 0 }
              : { delay: 0.25 + idx * 0.06, duration: 0.35 }
            }
          >
            {label}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
