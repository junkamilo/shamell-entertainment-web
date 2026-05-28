"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Ticket } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { onComingEventSeatsHref } from "@/lib/upcomingEventPublicRoutes";

/** Sit above WhatsApp FAB: bottom-6 (24px) + h-14 (56px) + gap */
const FAB_OFFSET_BOTTOM = "bottom-[6.25rem]";

type Props = {
  slug: string;
  experienceType: "CLASSES" | "VENUE_SEATING" | null;
  purchasable: boolean;
  salesOpen: boolean;
  hasActiveSessions: boolean;
  onBookClasses: () => void;
};

function disabledMessage(
  experienceType: Props["experienceType"],
  salesOpen: boolean,
  hasActiveSessions: boolean,
): string {
  if (experienceType === "VENUE_SEATING" && !salesOpen) return "Sales not open yet";
  if (experienceType === "CLASSES" && !hasActiveSessions) return "No sessions available";
  return "Not available";
}

export function OnComingEventStickyPurchaseBar({
  slug,
  experienceType,
  purchasable,
  salesOpen,
  hasActiveSessions,
  onBookClasses,
}: Props) {
  const router = useRouter();
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isSeating = experienceType === "VENUE_SEATING";
  const label = isSeating ? "Choose your seat" : "Book now";
  const statusText = !purchasable ?
    disabledMessage(experienceType, salesOpen, hasActiveSessions)
  : null;

  const handleClick = () => {
    if (!purchasable) return;
    if (isSeating) {
      router.push(onComingEventSeatsHref(slug));
      return;
    }
    onBookClasses();
  };

  return (
    <div
      className={cn(
        "pointer-events-none fixed right-4 z-[41] flex flex-col items-end gap-2 md:right-6",
        FAB_OFFSET_BOTTOM,
      )}
      role="region"
      aria-label="Purchase actions"
    >
      {statusText ? (
        <p
          className="pointer-events-auto max-w-[11rem] rounded-lg border border-gold/20 bg-black/75 px-3 py-1.5 text-right text-[11px] leading-snug text-foreground/75 shadow-lg backdrop-blur-sm"
          role="status"
        >
          {statusText}
        </p>
      ) : null}

      <motion.button
        type="button"
        disabled={!purchasable}
        onClick={handleClick}
        className={cn(
          "pointer-events-auto relative overflow-hidden rounded-full",
          "min-w-[10.5rem] px-6 py-3.5 sm:min-w-[11.5rem] sm:px-7 sm:py-4",
          "font-brand text-[11px] font-bold tracking-[0.2em] uppercase sm:text-xs sm:tracking-[0.22em]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light",
          purchasable ?
            [
              "border border-[#f5e6c8]/70 text-[#1a1208]",
              "bg-[linear-gradient(165deg,#f4e6c4_0%,#d4b76a_38%,#c5a55a_62%,#a8873f_100%)]",
              "shadow-[0_4px_20px_rgba(197,165,90,0.55),0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.45)]",
              "hover:shadow-[0_6px_28px_rgba(197,165,90,0.65),0_14px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.55)]",
              "hover:brightness-105 active:scale-[0.98]",
            ]
          : [
              "cursor-not-allowed border border-gold/25",
              "bg-[linear-gradient(165deg,rgba(80,68,48,0.5)_0%,rgba(40,34,24,0.85)_100%)]",
              "text-gold/45 shadow-[0_4px_16px_rgba(0,0,0,0.35)]",
            ],
        )}
        whileHover={purchasable && !prefersReducedMotion ? { scale: 1.04, y: -2 } : undefined}
        whileTap={purchasable && !prefersReducedMotion ? { scale: 0.97 } : undefined}
        animate={
          purchasable && !prefersReducedMotion ?
            {
              boxShadow: [
                "0 4px 20px rgba(197,165,90,0.45), 0 12px 40px rgba(0,0,0,0.4)",
                "0 6px 28px rgba(197,165,90,0.6), 0 14px 44px rgba(0,0,0,0.45)",
                "0 4px 20px rgba(197,165,90,0.45), 0 12px 40px rgba(0,0,0,0.4)",
              ],
            }
          : undefined
        }
        transition={
          purchasable && !prefersReducedMotion ?
            { boxShadow: { duration: 2.8, repeat: Infinity, ease: "easeInOut" } }
          : undefined
        }
      >
        {purchasable ? (
          <>
            <span
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_35%,rgba(255,255,255,0.35)_50%,transparent_65%)] opacity-60"
              aria-hidden
            />
            <span
              className="pointer-events-none absolute -inset-px rounded-full opacity-40 blur-md"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(255,236,200,0.5), transparent 70%)",
              }}
              aria-hidden
            />
          </>
        ) : null}

        <span className="relative flex items-center justify-center gap-2.5">
          {isSeating ?
            <Ticket className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
          : null}
          <span>{label}</span>
          {purchasable ?
            <ArrowRight className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.5} aria-hidden />
          : null}
        </span>
      </motion.button>
    </div>
  );
}
