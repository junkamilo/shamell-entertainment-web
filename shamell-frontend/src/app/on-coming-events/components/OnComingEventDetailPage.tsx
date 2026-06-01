"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import ShamellBusyOverlay from "@/components/shared/ShamellBusyOverlay";
import { ShamellBackButton } from "@/components/shared/ShamellBackButton";
import { FixedTicketInventoryDisplay } from "@/components/shared/FixedTicketInventoryDisplay";
import {
  isFutureEventStart,
  ShamellCountdown,
} from "@/components/shared/ShamellCountdown";
import { formatCatalogPriceAmount } from "@/lib/formatCatalogPrice";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import { onComingEventHubHref } from "@/lib/upcomingEventPublicRoutes";
import {
  fetchOnComingEventDetail,
  type OnComingEventDetail,
} from "../services/fetchOnComingEventDetail";
import { OnComingEventItemsSection } from "./OnComingEventItemsSection";
import { OnComingEventScheduleSection } from "./OnComingEventScheduleSection";
import { OnComingEventStickyPurchaseBar } from "./OnComingEventStickyPurchaseBar";
import { OnComingEventClassBookingModal } from "./OnComingEventClassBookingModal";
import { OnComingEventFixedTicketBookingModal } from "./OnComingEventFixedTicketBookingModal";

type Props = { slug: string };

function OnComingEventDetailError({
  message,
  backHref,
  onBackNavigateStart,
}: {
  message: string;
  backHref: string;
  onBackNavigateStart?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <section className="relative min-h-[42vh] w-full overflow-hidden bg-[#0a0908] md:min-h-[50vh]">
        <div className="absolute left-4 top-4 z-10 md:left-8 md:top-6">
          <ShamellBackButton
            href={backHref}
            label="Back"
            hideLabelOnMobile
            onNavigateStart={onBackNavigateStart}
          />
        </div>
      </section>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <p className="text-foreground/70">{message}</p>
        <Link
          href={backHref}
          className="mt-6 inline-block text-sm text-gold hover:underline"
          onClick={() => onBackNavigateStart?.()}
        >
          All On Coming Events
        </Link>
      </div>
    </div>
  );
}

export default function OnComingEventDetailPage({ slug }: Props) {
  const [event, setEvent] = useState<OnComingEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const handleBackNavigate = useCallback(() => {
    setLeaving(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOnComingEventDetail(slug);
      setEvent(data);
    } catch {
      setError("This event could not be found.");
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const heroUrl = event?.heroImageUrl ?? null;
  const heroIsVideo =
    event?.heroMediaType === "VIDEO" || serviceCatalogMediaTypeFromUrl(heroUrl) === "VIDEO";
  const hasPrice = event?.price != null && !Number.isNaN(Number(event.price));
  const isFixedTicket = event?.purchaseMode === "fixed_ticket";
  const isVenueSeating = event?.purchaseMode === "venue_seating";
  const ticketSoldOut = isFixedTicket && event?.ticketsRemaining === 0;
  const seatingSoldOut =
    isVenueSeating &&
    event?.tablesRemaining === 0 &&
    event?.tableCapacity != null &&
    event.tableCapacity >= 1;
  const soldOut = ticketSoldOut || seatingSoldOut;
  const showTicketInventory =
    isFixedTicket &&
    event?.fixedTicketCapacity != null &&
    event.fixedTicketCapacity >= 1;
  const showTableInventory =
    isVenueSeating && event?.tableCapacity != null && event.tableCapacity >= 1;
  const showCountdown =
    (isFixedTicket || isVenueSeating) && isFutureEventStart(event?.eventStartsAt);
  const hubHref = onComingEventHubHref();
  const showBusyOverlay = loading || leaving;
  const busyTitle = loading ? "Loading event…" : "Loading upcoming events…";

  return (
    <>
      <ShamellBusyOverlay active={showBusyOverlay} title={busyTitle} />

      {!loading && !leaving ? (
        <main className="relative z-10 flex min-h-screen flex-col text-foreground">
          <div className="flex flex-1 flex-col">
            {error ? (
              <OnComingEventDetailError
                message={error}
                backHref={hubHref}
                onBackNavigateStart={handleBackNavigate}
              />
            ) : null}

            {!error && event ? (
              <>
                <section className="relative min-h-[42vh] w-full overflow-hidden md:min-h-[50vh]">
            {heroUrl ? (
              heroIsVideo ? (
                <video
                  src={heroUrl}
                  className="absolute inset-0 h-full w-full object-cover object-center"
                  muted
                  playsInline
                  loop
                  autoPlay
                  aria-label={`${event.eventTypeName} hero`}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
              )
            ) : (
              <div className="absolute inset-0 bg-[#0a0908]" />
            )}
            <div className="absolute inset-0 bg-black/55" aria-hidden />
            <div className="absolute left-4 top-4 z-10 md:left-8 md:top-6">
              <ShamellBackButton
                href={hubHref}
                label="Back"
                hideLabelOnMobile
                onNavigateStart={handleBackNavigate}
              />
            </div>
            <div className="relative flex min-h-[42vh] flex-col items-center justify-center px-4 py-24 md:min-h-[50vh]">
              {hasPrice ? (
                <div
                  className="absolute right-4 top-4 rounded-lg border border-gold/50 bg-black/60 px-4 py-2 text-center shadow-lg md:right-8 md:top-6"
                  aria-label={`Price ${formatCatalogPriceAmount(event.price!)} USD`}
                >
                  <span className="font-display text-2xl text-gold md:text-3xl">
                    {formatCatalogPriceAmount(event.price!)}
                  </span>
                  <span className="mt-0.5 block font-brand text-[10px] tracking-[0.2em] text-gold/80">
                    USD
                  </span>
                </div>
              ) : null}
              <h1 className="max-w-3xl text-center font-display text-3xl text-gold md:text-5xl">
                {event.eventTypeName}
              </h1>
            </div>
                </section>

                <div className="mx-auto max-w-3xl px-4 pb-36 pt-10 md:max-w-4xl md:pb-40">
            {event.description ? (
              <p className="text-center font-body text-base leading-relaxed text-foreground/88 md:text-lg">
                {event.description}
              </p>
            ) : null}

            {showCountdown && event.eventStartsAt ? (
              <div className="mt-10">
                <ShamellCountdown targetAt={event.eventStartsAt} label="Event begins in" />
              </div>
            ) : null}

            {showTicketInventory && event ? (
              <FixedTicketInventoryDisplay
                className={showCountdown && event.eventStartsAt ? "mt-6" : "mt-10"}
                fixedTicketCapacity={event.fixedTicketCapacity!}
                ticketsRemaining={event.ticketsRemaining ?? event.fixedTicketCapacity!}
                ticketsSold={event.ticketsSold}
                soldOut={soldOut}
                size="md"
              />
            ) : null}

            {showTableInventory && event ? (
              <FixedTicketInventoryDisplay
                className={showCountdown && event.eventStartsAt ? "mt-6" : "mt-10"}
                fixedTicketCapacity={event.tableCapacity!}
                ticketsRemaining={event.tablesRemaining ?? event.tableCapacity!}
                ticketsSold={event.tablesSold}
                soldOut={soldOut}
                size="md"
                inventoryType="table"
              />
            ) : null}

            {soldOut ? (
              <p className="mt-4 text-center font-body text-base text-foreground/45 md:text-lg" role="status">
                {seatingSoldOut ? "All tables have been sold" : "All tickets have been sold"}
              </p>
            ) : null}

            <OnComingEventItemsSection items={event.items} />

            <OnComingEventScheduleSection schedule={event.schedule} />
                </div>

                {event.purchaseMode !== "none" ? (
                  <OnComingEventStickyPurchaseBar
              slug={slug}
              purchaseMode={event.purchaseMode}
              purchasable={event.purchasable}
              salesOpen={event.salesOpen}
              hasActiveSessions={event.hasActiveSessions}
              ticketsRemaining={event.ticketsRemaining}
              onBookClasses={() => setBookingOpen(true)}
              onBuyTicket={() => setTicketOpen(true)}
                  />
                ) : null}

                {event.purchaseMode === "classes" ? (
                  <OnComingEventClassBookingModal
                    slug={slug}
                    sessions={event.sessions}
                    open={bookingOpen}
                    onClose={() => setBookingOpen(false)}
                  />
                ) : null}

                {event.purchaseMode === "fixed_ticket" ? (
                  <OnComingEventFixedTicketBookingModal
                    slug={slug}
                    eventName={event.eventTypeName}
                    price={event.price}
                    open={ticketOpen}
                    onClose={() => setTicketOpen(false)}
                  />
                ) : null}
              </>
            ) : null}
          </div>

          <Footer />
        </main>
      ) : null}
    </>
  );
}
