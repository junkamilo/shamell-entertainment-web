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
import { onComingEventHubHref } from "@/lib/upcomingEventPublicRoutes";
import {
  fetchOnComingEventDetail,
  type OnComingEventDetail,
} from "../services/fetchOnComingEventDetail";
import { OnComingEventHeroSection } from "./OnComingEventHeroSection";
import { OnComingEventItemsSection } from "./OnComingEventItemsSection";
import { OnComingEventScheduleSection } from "./OnComingEventScheduleSection";
import { OnComingEventStickyPurchaseBar } from "./OnComingEventStickyPurchaseBar";
import { ClassBookingWizard, weekdayFromIsoDate } from "./ClassBookingWizard";
import { OnComingEventFixedTicketBookingModal } from "./OnComingEventFixedTicketBookingModal";
import {
  classPriceHeroAriaLabel,
  computeClassPriceDisplay,
  formatClassPriceHeroLabel,
  formatClassPriceHeroPrefix,
} from "../lib/computeClassPriceDisplay";

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
            fallbackHref={backHref}
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
  const [bookingFlow, setBookingFlow] = useState<"day" | "month">("day");
  const [bookingWeekday, setBookingWeekday] = useState<number | null>(null);
  const [bookingDateIso, setBookingDateIso] = useState<string | null>(null);
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

  const isClasses = event?.purchaseMode === "classes";
  const classPriceRange =
    event && isClasses
      ? computeClassPriceDisplay(event.sessions, event.price)
      : null;
  const hasCatalogPrice = event?.price != null && !Number.isNaN(Number(event.price));
  const showHeroPrice = isClasses ? classPriceRange != null : hasCatalogPrice;
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
  const showMonthPackage =
    isClasses && Boolean(event?.purchasable && event?.monthPackage?.purchasable);
  const monthPackageLabel = event?.monthPackage?.label ?? null;
  const hubHref = onComingEventHubHref();
  const openBooking = (dateIso: string | null = null, weekday: number | null = null) => {
    setBookingFlow("day");
    setBookingDateIso(dateIso);
    setBookingWeekday(weekday);
    setBookingOpen(true);
  };
  const openMonthPackageBooking = () => {
    setBookingFlow("month");
    setBookingDateIso(null);
    setBookingWeekday(null);
    setBookingOpen(true);
  };

  const showBusyOverlay = loading || leaving;
  const busyTitle = loading ? "Loading event…" : "Loading upcoming events…";

  return (
    <>
      <ShamellBusyOverlay active={showBusyOverlay} title={busyTitle} />

      {!loading && !leaving ? (
        <main className="relative z-10 flex min-h-screen flex-col overflow-x-hidden text-foreground">
          <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
            {error ? (
              <OnComingEventDetailError
                message={error}
                backHref={hubHref}
                onBackNavigateStart={handleBackNavigate}
              />
            ) : null}

            {!error && event ? (
              <>
                <OnComingEventHeroSection
                  title={event.eventTypeName}
                  heroImageUrl={event.heroImageUrl}
                  heroMediaType={event.heroMediaType}
                  backFallbackHref={hubHref}
                  onBackNavigate={handleBackNavigate}
                  price={event.price}
                  showPrice={showHeroPrice}
                  priceAriaLabel={
                    isClasses && classPriceRange
                      ? classPriceHeroAriaLabel(classPriceRange)
                      : event.price != null
                        ? `Price ${formatCatalogPriceAmount(event.price)} USD`
                        : undefined
                  }
                  priceBadge={
                    showHeroPrice && isClasses && classPriceRange ? (
                      <>
                        {formatClassPriceHeroPrefix(classPriceRange) ? (
                          <span className="block font-brand text-[10px] tracking-[0.2em] text-gold/80">
                            {formatClassPriceHeroPrefix(classPriceRange).trim()}
                          </span>
                        ) : null}
                        <span className="font-display text-2xl text-gold md:text-3xl">
                          {formatClassPriceHeroLabel(classPriceRange)}
                        </span>
                        <span className="mt-0.5 block font-brand text-[10px] tracking-[0.2em] text-gold/80">
                          USD
                        </span>
                      </>
                    ) : undefined
                  }
                />

                <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col items-center overflow-x-hidden px-4 pt-10 md:max-w-5xl">
            {event.description ? (
              <p className="min-w-0 w-full max-w-2xl text-center font-body text-base leading-relaxed break-all text-pretty text-foreground/88 sm:break-normal sm:wrap-anywhere md:text-lg">
                {event.description}
              </p>
            ) : null}

            {(showCountdown && event.eventStartsAt) || showTableInventory ? (
              <div
                className={
                  showCountdown && event.eventStartsAt && showTableInventory
                    ? "mt-10 grid w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-5"
                    : "mt-10 w-full max-w-2xl"
                }
              >
                {showCountdown && event.eventStartsAt ? (
                  <ShamellCountdown
                    targetAt={event.eventStartsAt}
                    label="Event begins in"
                    className="h-full"
                  />
                ) : null}
                {showTableInventory && event ? (
                  <FixedTicketInventoryDisplay
                    className="h-full"
                    fixedTicketCapacity={event.tableCapacity!}
                    ticketsRemaining={event.tablesRemaining ?? event.tableCapacity!}
                    ticketsSold={event.tablesSold}
                    soldOut={soldOut}
                    size="md"
                    inventoryType="table"
                  />
                ) : null}
              </div>
            ) : null}

            {showTicketInventory && event ? (
              <FixedTicketInventoryDisplay
                className="mt-10 w-full max-w-2xl"
                fixedTicketCapacity={event.fixedTicketCapacity!}
                ticketsRemaining={event.ticketsRemaining ?? event.fixedTicketCapacity!}
                ticketsSold={event.ticketsSold}
                soldOut={soldOut}
                size="md"
              />
            ) : null}

            {soldOut ? (
              <p className="mt-4 text-center font-body text-base text-foreground/45 md:text-lg" role="status">
                {seatingSoldOut ? "All tables have been sold" : "All tickets have been sold"}
              </p>
            ) : null}

            <OnComingEventItemsSection items={event.items} />
                </div>

            <OnComingEventScheduleSection
              schedule={event.schedule}
              calendarBookable={isClasses && event.purchasable}
              onCalendarDateClick={(iso) => {
                openBooking(iso, weekdayFromIsoDate(iso));
              }}
            />

                {event.purchaseMode !== "none" ? (
                  <OnComingEventStickyPurchaseBar
              slug={slug}
              purchaseMode={event.purchaseMode}
              purchasable={event.purchasable}
              salesOpen={event.salesOpen}
              hasActiveSessions={event.hasActiveSessions}
              ticketsRemaining={event.ticketsRemaining}
              showMonthPackage={showMonthPackage}
              monthPackageLabel={monthPackageLabel}
              onBuyMonthPackage={openMonthPackageBooking}
              onBuyTicket={() => setTicketOpen(true)}
                  />
                ) : null}

                {event.purchaseMode === "classes" ? (
                  <ClassBookingWizard
                    slug={slug}
                    sessions={event.sessions}
                    schedule={event.schedule}
                    monthPackage={event.monthPackage}
                    entryFlow={bookingFlow}
                    open={bookingOpen}
                    initialWeekday={bookingWeekday}
                    initialDateIso={bookingDateIso}
                    onClose={() => {
                      setBookingOpen(false);
                      setBookingFlow("day");
                      setBookingWeekday(null);
                      setBookingDateIso(null);
                    }}
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
