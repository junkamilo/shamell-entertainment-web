"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { EventCatalogCardHero } from "@/components/catalog/EventCatalogCardHero";
import { FixedTicketInventoryDisplay } from "@/components/shared/FixedTicketInventoryDisplay";
import {
  isFutureEventStart,
  ShamellCountdown,
} from "@/components/shared/ShamellCountdown";
import {
  onComingEventDetailHref,
  onComingEventSeatsHref,
} from "@/lib/upcomingEventPublicRoutes";
import type { UpcomingPurchaseMode } from "../services/fetchOnComingEventDetail";

export type OnComingEventHubCardItem = {
  slug: string;
  eventTypeName: string;
  heroImageUrl: string | null;
  heroMediaType?: "IMAGE" | "VIDEO";
  heroPosterUrl?: string | null;
  heroPosterUrlMobile?: string | null;
  experienceType?: "CLASSES" | "VENUE_SEATING" | null;
  purchaseMode?: UpcomingPurchaseMode;
  purchasable?: boolean;
  fixedTicketCapacity?: number;
  ticketsSold?: number;
  ticketsRemaining?: number;
  tableCapacity?: number;
  tablesSold?: number;
  tablesRemaining?: number;
  eventStartsAt?: string;
};

function hubCtaLabel(
  purchaseMode: UpcomingPurchaseMode | undefined,
  purchasable?: boolean,
  soldOut?: boolean,
) {
  if (soldOut) return "Sold out";
  if (purchaseMode === "venue_seating") return "Buy tables / seats";
  if (purchaseMode === "fixed_ticket" && purchasable) return "Buy ticket";
  if (purchaseMode === "classes") return "Book a session";
  return "View more information";
}

function showTicketInventory(event: OnComingEventHubCardItem): boolean {
  return (
    event.purchaseMode === "fixed_ticket" &&
    event.fixedTicketCapacity != null &&
    event.fixedTicketCapacity >= 1
  );
}

function showTableInventory(event: OnComingEventHubCardItem): boolean {
  return (
    event.purchaseMode === "venue_seating" &&
    event.tableCapacity != null &&
    event.tableCapacity >= 1
  );
}

export function OnComingEventHubCard({
  event,
  onNavigateStart,
  mobileCarousel,
  priorityHero = false,
}: {
  event: OnComingEventHubCardItem;
  onNavigateStart?: () => void;
  mobileCarousel?: boolean;
  /** Eager-load the hero image (first home card). */
  priorityHero?: boolean;
}) {
  const purchaseMode = event.purchaseMode ?? (
    event.experienceType === "VENUE_SEATING"
      ? "venue_seating"
      : event.experienceType === "CLASSES"
        ? "classes"
        : "none"
  );
  const isSeating = purchaseMode === "venue_seating";
  const isFixedTicket = purchaseMode === "fixed_ticket";
  const ticketSoldOut = isFixedTicket && event.ticketsRemaining === 0;
  const seatingSoldOut =
    isSeating &&
    event.tablesRemaining === 0 &&
    event.tableCapacity != null &&
    event.tableCapacity >= 1;
  const soldOut = ticketSoldOut || seatingSoldOut;
  const href = isSeating
    ? onComingEventSeatsHref(event.slug)
    : onComingEventDetailHref(event.slug);
  const ctaLabel = hubCtaLabel(purchaseMode, event.purchasable, soldOut);
  const ticketInventoryVisible = showTicketInventory(event);
  const tableInventoryVisible = showTableInventory(event);
  const showCountdown =
    (isFixedTicket || isSeating) && isFutureEventStart(event.eventStartsAt);
  const heroIsVideo = event.heroMediaType === "VIDEO";

  return (
    <article
      className={cn(
        "group/card relative flex min-h-0 flex-col overflow-hidden rounded-2xl",
        mobileCarousel
          ? "w-[17.5rem] max-w-[85vw] shrink-0 snap-start"
          : "mx-auto w-full max-w-[min(100%,17.5rem)]",
        "border border-gold/30",
        "bg-[linear-gradient(168deg,rgba(18,15,12,0.98)_0%,rgba(8,7,5,1)_48%,rgba(3,2,2,1)_100%)]",
        "shadow-[0_18px_56px_rgba(0,0,0,0.58),inset_0_1px_0_rgba(255,255,255,0.035)]",
        "transition-[transform,box-shadow,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        soldOut
          ? "opacity-60"
          : "hover:-translate-y-2 hover:shadow-[0_36px_96px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.05)] motion-reduce:hover:translate-y-0",
        "motion-reduce:transition-colors",
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-20 rounded-2xl" aria-hidden>
        <span className="absolute left-2.5 top-2.5 h-8 w-8 rounded-tl-[8px] border-l border-t border-gold/45" />
        <span className="absolute right-2.5 top-2.5 h-8 w-8 rounded-tr-[8px] border-r border-t border-gold/45" />
        <span className="absolute bottom-2.5 left-2.5 h-8 w-8 rounded-bl-[8px] border-b border-l border-gold/35" />
        <span className="absolute bottom-2.5 right-2.5 h-8 w-8 rounded-br-[8px] border-b border-r border-gold/35" />
      </div>

      <div className="relative">
        <EventCatalogCardHero
          imageUrl={event.heroImageUrl}
          mediaType={heroIsVideo ? "VIDEO" : "IMAGE"}
          posterUrl={event.heroPosterUrl}
          posterUrlMobile={event.heroPosterUrlMobile}
          videoUrl={heroIsVideo ? event.heroImageUrl : null}
          title={event.eventTypeName}
          aspectClassName="aspect-[3/4]"
          priority={priorityHero}
        />
        {soldOut ? (
          <div
            className="absolute inset-x-0 bottom-0 z-10 bg-black/55 px-3 py-2 text-center"
            role="status"
          >
            <p className="font-body text-[11px] leading-snug text-foreground/45">
              {seatingSoldOut ? "All tables have been sold" : "All tickets have been sold"}
            </p>
          </div>
        ) : null}
      </div>

      <div className="relative z-10 flex flex-1 flex-col px-4 pb-5 pt-3">
        <h2 className="line-clamp-2 text-center font-display text-lg leading-snug text-gold md:text-xl">
          {event.eventTypeName}
        </h2>

        {ticketInventoryVisible ? (
          <div className="mt-3">
            <FixedTicketInventoryDisplay
              fixedTicketCapacity={event.fixedTicketCapacity!}
              ticketsRemaining={event.ticketsRemaining ?? event.fixedTicketCapacity!}
              ticketsSold={event.ticketsSold}
              soldOut={soldOut}
              size="sm"
            />
          </div>
        ) : null}

        {tableInventoryVisible ? (
          <div className="mt-3">
            <FixedTicketInventoryDisplay
              fixedTicketCapacity={event.tableCapacity!}
              ticketsRemaining={event.tablesRemaining ?? event.tableCapacity!}
              ticketsSold={event.tablesSold}
              soldOut={soldOut}
              size="sm"
              inventoryType="table"
            />
          </div>
        ) : null}

        {showCountdown && event.eventStartsAt ? (
          <div className="mt-3">
            <ShamellCountdown targetAt={event.eventStartsAt} size="sm" />
          </div>
        ) : null}

        <Link
          href={href}
          onClick={() => onNavigateStart?.()}
          className={cn(
            "relative mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 overflow-hidden border px-4 py-2.5 font-brand text-[10px] font-semibold tracking-[0.16em] uppercase",
            soldOut
              ? "pointer-events-auto cursor-default border-foreground/15 bg-black/30 text-foreground/40"
              : [
                  "border-gold/35 bg-black/40 text-gold",
                  "transition-all duration-300",
                  "hover:border-gold/55 hover:bg-gold/[0.07] hover:text-gold-light",
                ],
          )}
          aria-disabled={soldOut ? true : undefined}
        >
          {ctaLabel}
          {!soldOut ? (
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : null}
        </Link>
      </div>
    </article>
  );
}
