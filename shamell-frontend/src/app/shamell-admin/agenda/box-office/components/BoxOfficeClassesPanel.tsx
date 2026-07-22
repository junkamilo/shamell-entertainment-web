"use client";

import { useMemo } from "react";
import AdminAccordionSingleSelect from "@/components/admin/AdminAccordionSingleSelect";
import {
  formatSeatAvailability,
} from "@/app/on-coming-events/lib/buildDaySectionOffers";
import { formatPriceEn } from "@/lib/pricing";
import { cn } from "@/lib/utils";
import {
  fieldLabelClass,
  submitButtonClass,
} from "../../shared/lib/agendaFormStyles";
import { AgendaCatalogSpinner } from "../../shared/components/AgendaCatalogSpinner";
import { formatSectionTime } from "../../book-class/lib/bookClassDisplay";
import { useBoxOfficeClassesForm } from "../hooks/useBoxOfficeClassesForm";
import { BoxOfficeGuestPaymentFields } from "./BoxOfficeGuestPaymentFields";

export function BoxOfficeClassesPanel() {
  const form = useBoxOfficeClassesForm();

  const eventOptions = useMemo(
    () => form.events.map((ev) => ({ id: ev.id, label: ev.name })),
    [form.events],
  );

  if (form.eventsLoading) {
    return <AgendaCatalogSpinner />;
  }

  if (!form.events.length && !form.eventsError) {
    return (
      <p className="rounded-xl border border-gold/20 bg-background/40 px-5 py-6 text-sm text-foreground/75">
        No bookable class events yet. Configure a RECURRING WEEKDAYS (CLASSES)
        event under On Coming Events.
      </p>
    );
  }

  const submitLabel =
    form.paymentMethod === "cash"
      ? "CONFIRM CLASS RESERVATION"
      : "SEND PAYMENT LINK";

  const showForm =
    Boolean(form.eventId) &&
    form.context &&
    !form.contextLoading &&
    form.contextBookable;

  return (
    <form
      noValidate
      onSubmit={form.onSubmit}
      className="shamell-glass-surface space-y-5 rounded-2xl p-4 sm:p-5 md:p-8"
    >
      {form.eventsError ? (
        <p className="text-sm text-destructive">{form.eventsError}</p>
      ) : null}

      <div className="block">
        <span className={fieldLabelClass}>CLASS EVENT</span>
        <div className="mt-2">
          <AdminAccordionSingleSelect
            options={eventOptions}
            value={form.eventId}
            onChange={form.onSelectEvent}
            emptyDisplay="Select a class event"
            ariaLabel="Select class event"
            required
            showNoneOption
          />
        </div>
      </div>

      {form.contextLoading ? <AgendaCatalogSpinner /> : null}

      {form.contextError ? (
        <p className="text-sm text-destructive">{form.contextError}</p>
      ) : null}

      {form.eventId &&
      form.context &&
      !form.contextLoading &&
      !form.contextBookable ? (
        <div className="rounded-xl border border-gold/25 bg-black/25 px-4 py-3 text-sm text-foreground/75">
          <p className="font-brand text-xs tracking-[0.12em] text-gold">
            CLASS EVENT NOT READY
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {form.setupIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {showForm ? (
        <>
          <fieldset className="space-y-2">
            <legend className={fieldLabelClass}>BOOKING TYPE</legend>
            <label className="flex items-center gap-2 text-sm text-foreground/85">
              <input
                type="radio"
                name="box-office-booking-kind"
                checked={form.bookingKind === "day"}
                onChange={() => form.setBookingKind("day")}
              />
              Day drop-in (one or more sections)
            </label>
            {form.hasMonthPackage ? (
              <label className="flex items-center gap-2 text-sm text-foreground/85">
                <input
                  type="radio"
                  name="box-office-booking-kind"
                  checked={form.bookingKind === "month"}
                  onChange={() => {
                    form.setBookingKind("month");
                    if (form.monthPackage?.currentMonthIso) {
                      form.setMonthIso(form.monthPackage.currentMonthIso);
                    }
                  }}
                />
                {form.monthPackage?.label?.trim() || "Full month package"}
              </label>
            ) : null}
          </fieldset>

          {form.bookingKind === "day" ? (
            <>
              {form.days.length > 0 ? (
                <div>
                  <p className={fieldLabelClass}>CLASS DAY</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.days.map((day) => (
                      <button
                        key={day.weekday}
                        type="button"
                        onClick={() => form.onSelectWeekday(day.weekday)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 font-brand text-[10px] tracking-[0.14em]",
                          form.weekday === day.weekday
                            ? "border-gold/40 bg-gold/12 text-gold"
                            : "border-gold/18 text-foreground/65 hover:border-gold/35 hover:text-gold",
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

              {form.weekday != null && form.sectionOffers.length > 0 ? (
                <div className="space-y-3">
                  <p className={fieldLabelClass}>SECTIONS</p>
                  {form.sectionOffers.map((offer) => {
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
                          if (offer.sessionId) {
                            form.toggleSessionId(offer.sessionId);
                          }
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
                            <p className="font-brand text-sm text-gold">
                              {offer.label}
                            </p>
                            <p className="mt-1 text-xs text-foreground/65">
                              {formatSectionTime(
                                offer.startTime,
                                offer.endTime,
                              )}
                            </p>
                            <p className="mt-1 text-xs text-foreground/50">
                              {formatSeatAvailability(
                                offer.capacity,
                                offer.seatsRemaining,
                              )}
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
                {form.monthPackage?.label?.trim() || "Full month package"}
              </p>
              {form.monthPreview ? (
                <p className="mt-2 text-sm text-foreground/70">
                  {form.monthPreview.monthLabel} ·{" "}
                  {form.monthPreview.sessionCount} session
                  {form.monthPreview.sessionCount === 1 ? "" : "s"}
                </p>
              ) : null}
              {form.monthPackage?.price != null ? (
                <p className="mt-2 text-lg font-semibold text-gold">
                  {formatPriceEn(form.monthPackage.price)}
                </p>
              ) : null}
            </div>
          )}

          {form.displayTotal != null ? (
            <div className="flex items-center justify-between border-t border-gold/15 pt-4">
              <span className={fieldLabelClass}>TOTAL</span>
              <span className="text-lg font-semibold text-gold">
                {formatPriceEn(form.displayTotal)}
              </span>
            </div>
          ) : null}

          <BoxOfficeGuestPaymentFields
            customerName={form.customerName}
            customerEmail={form.customerEmail}
            customerPhone={form.customerPhone}
            paymentMethod={form.paymentMethod}
            cashConfirmed={form.cashConfirmed}
            onNameChange={form.setCustomerName}
            onEmailChange={form.setCustomerEmail}
            onPhoneChange={form.setCustomerPhone}
            onPaymentMethodChange={form.setPaymentMethod}
            onCashConfirmedChange={form.setCashConfirmed}
          />

          {form.formError ? (
            <p className="text-sm text-destructive">{form.formError}</p>
          ) : null}

          <button
            type="submit"
            disabled={form.submitting}
            className={submitButtonClass}
          >
            {form.submitting ? "PLEASE WAIT…" : submitLabel}
          </button>
        </>
      ) : null}
    </form>
  );
}
