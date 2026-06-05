"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Ticket } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";
import { onComingEventSeatsHref } from "@/lib/upcomingEventPublicRoutes";
import type { UpcomingPurchaseMode } from "../services/fetchOnComingEventDetail";

/** Sit above WhatsApp FAB: bottom-6 (24px) + h-14 (56px) + gap */
const FAB_OFFSET_BOTTOM = "bottom-[6.25rem]";

type Props = {
  slug: string;
  purchaseMode: UpcomingPurchaseMode;
  purchasable: boolean;
  salesOpen: boolean;
  hasActiveSessions: boolean;
  ticketsRemaining?: number;
  showMonthPackage?: boolean;
  monthPackageLabel?: string | null;
  onBuyMonthPackage: () => void;
  onBuyTicket: () => void;
};

function disabledMessage(
  purchaseMode: UpcomingPurchaseMode,
  salesOpen: boolean,
  hasActiveSessions: boolean,
  ticketsRemaining?: number,
): string {
  if (purchaseMode === "venue_seating" && !salesOpen) return "Sales not open yet";
  if (purchaseMode === "fixed_ticket" && !salesOpen) return "Ticket sales not open yet";
  if (purchaseMode === "fixed_ticket" && ticketsRemaining === 0) {
    return "All tickets have been sold";
  }
  if (purchaseMode === "classes" && !hasActiveSessions) return "No sessions available";
  return "Not available";
}

const btnClass = (purchasable: boolean, soldOut: boolean) =>
  cn(
    "pointer-events-auto relative overflow-hidden rounded-full",
    "min-w-[10.5rem] px-6 py-3.5 sm:min-w-[11.5rem] sm:px-7 sm:py-4",
    "font-brand text-[11px] font-bold tracking-[0.2em] uppercase sm:text-xs sm:tracking-[0.22em]",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-light",
    purchasable
      ? [
          "border border-[#f5e6c8]/70 text-[#1a1208]",
          "bg-[linear-gradient(165deg,#f4e6c4_0%,#d4b76a_38%,#c5a55a_62%,#a8873f_100%)]",
          "shadow-[0_4px_20px_rgba(197,165,90,0.55),0_12px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.45)]",
          "hover:shadow-[0_6px_28px_rgba(197,165,90,0.65),0_14px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.55)]",
          "hover:brightness-105 active:scale-[0.98]",
        ]
      : [
          "cursor-not-allowed border border-foreground/15",
          "bg-[linear-gradient(165deg,rgba(40,36,32,0.55)_0%,rgba(24,22,20,0.9)_100%)]",
          soldOut ? "text-foreground/40" : "text-gold/45",
          "shadow-[0_4px_16px_rgba(0,0,0,0.35)]",
        ],
  );

export function OnComingEventStickyPurchaseBar({
  slug,
  purchaseMode,
  purchasable,
  salesOpen,
  hasActiveSessions,
  ticketsRemaining,
  showMonthPackage = false,
  monthPackageLabel,
  onBuyMonthPackage,
  onBuyTicket,
}: Props) {
  const router = useRouter();
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isSeating = purchaseMode === "venue_seating";
  const isTicket = purchaseMode === "fixed_ticket";
  const isClasses = purchaseMode === "classes";
  const classesPurchasable = showMonthPackage;
  const soldOut = isTicket && ticketsRemaining === 0;
  const primaryLabel =
    soldOut ? "Sold out"
    : isSeating ? "Choose your seat"
    : isTicket ? "Buy ticket"
    : (monthPackageLabel?.trim() || "Buy full month");
  const effectivePurchasable = isClasses ? classesPurchasable : purchasable;
  const statusText = !effectivePurchasable
    ? disabledMessage(purchaseMode, salesOpen, hasActiveSessions, ticketsRemaining)
    : null;

  if (isClasses && !showMonthPackage) return null;

  const handlePrimary = () => {
    if (!effectivePurchasable) return;
    if (isSeating) {
      router.push(onComingEventSeatsHref(slug));
      return;
    }
    if (isTicket) {
      onBuyTicket();
      return;
    }
    onBuyMonthPackage();
  };

  return (
    <div
      className={cn(
        "site-floating-actions pointer-events-none fixed right-4 z-[41] flex flex-col items-end gap-2 md:right-6",
        FAB_OFFSET_BOTTOM,
      )}
      role="region"
      aria-label="Purchase actions"
    >
      {statusText ? (
        <p
          className={cn(
            "pointer-events-auto max-w-[13rem] rounded-lg border px-3 py-1.5 text-right text-[11px] leading-snug shadow-lg backdrop-blur-sm",
            soldOut
              ? "border-foreground/15 bg-black/60 text-foreground/45"
              : "border-gold/20 bg-black/75 text-foreground/75",
          )}
          role="status"
        >
          {statusText}
        </p>
      ) : null}

      <motion.button
        type="button"
        disabled={!effectivePurchasable}
        onClick={handlePrimary}
        className={btnClass(effectivePurchasable, soldOut)}
        whileHover={effectivePurchasable && !prefersReducedMotion ? { scale: 1.04, y: -2 } : undefined}
        whileTap={effectivePurchasable && !prefersReducedMotion ? { scale: 0.97 } : undefined}
        animate={
          effectivePurchasable && !prefersReducedMotion
            ? {
                boxShadow: [
                  "0 4px 20px rgba(197,165,90,0.45), 0 12px 40px rgba(0,0,0,0.4)",
                  "0 6px 28px rgba(197,165,90,0.6), 0 14px 44px rgba(0,0,0,0.45)",
                  "0 4px 20px rgba(197,165,90,0.45), 0 12px 40px rgba(0,0,0,0.4)",
                ],
              }
            : undefined
        }
        transition={
          effectivePurchasable && !prefersReducedMotion
            ? { boxShadow: { duration: 2.8, repeat: Infinity, ease: "easeInOut" } }
            : undefined
        }
      >
        {effectivePurchasable ? (
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
          {isSeating || isTicket ? (
            <Ticket className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} aria-hidden />
          ) : null}
          <span>{primaryLabel}</span>
          {effectivePurchasable ? (
            <ArrowRight className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.5} aria-hidden />
          ) : null}
        </span>
      </motion.button>
    </div>
  );
}
