"use client";

import { cn } from "@/lib/utils";
import { formatPriceEn } from "@/lib/pricing";
import { fieldLabelClass, submitButtonClass } from "../../shared/lib/agendaFormStyles";
import { formatSeatAvailability } from "@/features/on-coming-events/lib/buildDaySectionOffers";
import { formatSectionTime, inputClass } from "../lib/bookClassDisplay";
import { useBookClassPage } from "../hooks/useBookClassPage";
import { AgendaCatalogSpinner } from "../../shared/components/AgendaCatalogSpinner";
import { BookClassEmptyState } from "./BookClassEmptyState";
import { BookClassSetupNotice } from "./BookClassSetupNotice";

export const BOOK_CLASS_FORM_ID = "shamell-agendar-book-class-form";

export function BookClassForm() {
  const page = useBookClassPage();
  const {
    form,
    catalog,
    days,
    monthPackage,
    hasMonthPackage,
    sectionOffers,
    monthPreview,
    displayTotal,
    submitting,
    contextBookable,
    setupIssues,
    onSelectWeekday,
    onSubmit,
  } = page;

  if (catalog.eventsLoading) {
    return <AgendaCatalogSpinner />;
  }

  if (!catalog.hasBookableEvents) {
    return <BookClassEmptyState />;
  }

  const showSetupNotice =
    Boolean(form.eventId) &&
    catalog.context &&
    !catalog.contextLoading &&
    !contextBookable;

  return (
    <form
      id={BOOK_CLASS_FORM_ID}
      noValidate
      onSubmit={onSubmit}
      className="shamell-glass-surface space-y-4 md:space-y-6 rounded-2xl p-4 sm:p-5 md:p-8"
    >
      {catalog.error ? (
        <p className="text-sm text-destructive">{catalog.error}</p>
      ) : null}

      <label className="block">
        <span className={fieldLabelClass}>CLASS EVENT</span>
        <select
          value={form.eventId}
          onChange={(e) => {
            form.setEventId(e.target.value);
            form.resetForEventChange();
          }}
          className={inputClass}
        >
          <option value="">Select a class event</option>
          {catalog.events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.name}
            </option>
          ))}
        </select>
      </label>

      {catalog.contextLoading ? <AgendaCatalogSpinner /> : null}

      {showSetupNotice ? <BookClassSetupNotice issues={setupIssues} /> : null}

      {form.eventId && catalog.context && !catalog.contextLoading && contextBookable ? (
        <>
          <fieldset className="space-y-2">
            <legend className={fieldLabelClass}>BOOKING TYPE</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="bookingKind"
                checked={form.bookingKind === "day"}
                onChange={() => form.setBookingKind("day")}
              />
              Day drop-in (one or more sections)
            </label>
            {hasMonthPackage ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="bookingKind"
                  checked={form.bookingKind === "month"}
                  onChange={() => {
                    form.setBookingKind("month");
                    if (monthPackage?.currentMonthIso) {
                      form.setMonthIso(monthPackage.currentMonthIso);
                    }
                  }}
                />
                {monthPackage?.label?.trim() || "Full month package"}
              </label>
            ) : null}
          </fieldset>

          {form.bookingKind === "day" ? (
            <>
              {days.length > 0 ? (
                <div>
                  <p className={fieldLabelClass}>CLASS DAY</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {days.map((day) => (
                      <button
                        key={day.weekday}
                        type="button"
                        onClick={() => onSelectWeekday(day.weekday)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-xs tracking-wide",
                          form.weekday === day.weekday
                            ? "border-gold/40 bg-gold/12 text-gold"
                            : "border-gold/18 text-foreground/65 hover:border-gold/35",
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  {form.selectedDateIso ? (
                    <p className="mt-2 text-xs text-foreground/60">
                      Next date: {form.selectedDateIso}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-foreground/60">
                  No recurring schedule configured for this event.
                </p>
              )}

              {form.weekday != null && sectionOffers.length > 0 ? (
                <div className="space-y-3">
                  <p className={fieldLabelClass}>SECTIONS</p>
                  {sectionOffers.map((offer) => {
                    const selected =
                      offer.sessionId != null &&
                      form.selectedSessionIds.has(offer.sessionId);
                    const disabled = !offer.available || !offer.sessionId;
                    return (
                      <button
                        key={offer.sectionId}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          if (offer.sessionId) form.toggleSessionId(offer.sessionId);
                        }}
                        className={cn(
                          "w-full rounded-xl border p-4 text-left transition",
                          selected
                            ? "border-gold/45 bg-gold/10"
                            : "border-gold/18 bg-black/20 hover:border-gold/30",
                          disabled && "cursor-not-allowed opacity-50",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-brand text-sm text-gold">{offer.label}</p>
                            <p className="mt-1 text-xs text-foreground/65">
                              {formatSectionTime(offer.startTime, offer.endTime)}
                            </p>
                            <p className="mt-1 text-xs text-foreground/50">
                              {formatSeatAvailability(offer.capacity, offer.seatsRemaining)}
                            </p>
                          </div>
                          {offer.price != null ? (
                            <p className="text-sm font-semibold text-gold">
                              {formatPriceEn(offer.price)}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-xl border border-gold/18 bg-black/20 p-4">
              <p className="font-brand text-sm text-gold">
                {monthPackage?.label?.trim() || "Full month package"}
              </p>
              {monthPreview ? (
                <p className="mt-2 text-sm text-foreground/70">
                  {monthPreview.monthLabel} · {monthPreview.sessionCount} session
                  {monthPreview.sessionCount === 1 ? "" : "s"}
                </p>
              ) : null}
              {monthPackage?.price != null ? (
                <p className="mt-2 text-lg font-semibold text-gold">
                  {formatPriceEn(monthPackage.price)}
                </p>
              ) : null}
            </div>
          )}

          {displayTotal != null ? (
            <div className="flex items-center justify-between border-t border-gold/15 pt-4">
              <span className={fieldLabelClass}>TOTAL</span>
              <span className="text-lg font-semibold text-gold">
                {formatPriceEn(displayTotal)}
              </span>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={fieldLabelClass}>FULL NAME</span>
              <input
                required
                value={form.customerName}
                onChange={(e) => form.setCustomerName(e.target.value)}
                className={inputClass}
                autoComplete="name"
              />
            </label>
            <label className="block">
              <span className={fieldLabelClass}>EMAIL</span>
              <input
                type="email"
                required
                value={form.customerEmail}
                onChange={(e) => form.setCustomerEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
            </label>
            <label className="block">
              <span className={fieldLabelClass}>PHONE (OPTIONAL)</span>
              <input
                type="tel"
                value={form.customerPhone}
                onChange={(e) => form.setCustomerPhone(e.target.value)}
                className={inputClass}
                autoComplete="tel"
              />
            </label>
          </div>

          <fieldset className="space-y-2">
            <legend className={fieldLabelClass}>PAYMENT METHOD</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="paymentMethod"
                checked={form.paymentMethod === "stripe"}
                onChange={() => form.setPaymentMethod("stripe")}
              />
              Stripe (email payment link to guest)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="paymentMethod"
                checked={form.paymentMethod === "cash"}
                onChange={() => form.setPaymentMethod("cash")}
              />
              Cash (reserve immediately)
            </label>
          </fieldset>

          {form.paymentMethod === "cash" ? (
            <label className="flex items-start gap-2 text-xs text-foreground/75">
              <input
                type="checkbox"
                checked={form.cashConfirmed}
                onChange={(e) => form.setCashConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              I confirm cash payment was received from the guest.
            </label>
          ) : null}

          <button
            type="submit"
            disabled={submitting || !contextBookable}
            className={submitButtonClass}
          >
            {submitting
              ? "Processing…"
              : form.paymentMethod === "cash"
                ? "CONFIRM CLASS RESERVATION"
                : "SEND PAYMENT LINK"}
          </button>
        </>
      ) : null}
    </form>
  );
}
