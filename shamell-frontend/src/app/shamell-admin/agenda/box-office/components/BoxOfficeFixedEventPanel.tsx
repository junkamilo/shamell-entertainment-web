"use client";

import { useMemo } from "react";
import AdminAccordionSingleSelect from "@/components/admin/AdminAccordionSingleSelect";
import { formatPriceEn } from "@/lib/pricing";
import {
  fieldLabelClass,
  submitButtonClass,
} from "../../shared/lib/agendaFormStyles";
import { AgendaCatalogSpinner } from "../../shared/components/AgendaCatalogSpinner";
import { useBoxOfficeFixedEventForm } from "../hooks/useBoxOfficeFixedEventForm";
import { BoxOfficeGuestPaymentFields } from "./BoxOfficeGuestPaymentFields";
import { BoxOfficeSeatPicker } from "./BoxOfficeSeatPicker";

export function BoxOfficeFixedEventPanel() {
  const form = useBoxOfficeFixedEventForm();

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
        No FIXED EVENT or seating ON COMING events are available yet. Create one
        under On Coming Events.
      </p>
    );
  }

  const submitLabel =
    form.paymentMethod === "cash"
      ? form.selectedEvent?.purchaseKind === "fixed_ticket"
        ? "CONFIRM TICKET RESERVATION"
        : "CONFIRM SEAT RESERVATION"
      : "SEND PAYMENT LINK";

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
        <span className={fieldLabelClass}>ON COMING EVENT</span>
        <div className="mt-2">
          <AdminAccordionSingleSelect
            options={eventOptions}
            value={form.eventId}
            onChange={form.onSelectEvent}
            emptyDisplay="Select an event"
            ariaLabel="Select ON COMING event"
            required
            showNoneOption
          />
        </div>
      </div>

      {form.selectedEvent?.purchaseKind === "venue_seating" ? (
        <div className="space-y-3">
          <span className={fieldLabelClass}>TABLES & CHAIRS</span>
          <BoxOfficeSeatPicker
            seats={form.seats}
            selectedSeatId={form.selectedSeatId}
            onSelect={form.setSelectedSeatId}
            loading={form.seatsLoading}
          />
          {form.selectedSeat ? (
            <div className="rounded-xl border border-gold/20 bg-black/20 px-4 py-3 text-sm">
              <p className="text-foreground/70">
                Event:{" "}
                <span className="text-foreground">
                  {form.selectedEvent.name}
                </span>
              </p>
              <p className="text-foreground/70">
                Selection:{" "}
                <span className="text-foreground">
                  {form.selectedSeat.seatLabel}
                </span>
              </p>
              <p className="text-foreground/70">
                Detail:{" "}
                <span className="text-foreground">
                  {form.selectedSeat.fullLabel}
                  {form.selectedSeat.detail
                    ? ` · ${form.selectedSeat.detail}`
                    : ""}
                </span>
              </p>
              <p className="mt-1 text-gold">
                Subtotal:{" "}
                {form.selectedSeat.amount != null
                  ? formatPriceEn(form.selectedSeat.amount)
                  : "—"}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {form.selectedEvent?.purchaseKind === "fixed_ticket" ? (
        <div className="rounded-xl border border-gold/20 bg-black/20 px-4 py-3 text-sm">
          <p className="text-foreground/70">
            Ticket:{" "}
            <span className="text-foreground">{form.selectedEvent.name}</span>
          </p>
          <p className="mt-1 text-gold">
            Price:{" "}
            {form.selectedEvent.price != null
              ? formatPriceEn(form.selectedEvent.price)
              : "—"}
          </p>
          {form.selectedEvent.ticketsRemaining != null ? (
            <p className="mt-1 text-foreground/65">
              Remaining: {form.selectedEvent.ticketsRemaining}
              {form.selectedEvent.fixedTicketCapacity != null
                ? ` / ${form.selectedEvent.fixedTicketCapacity}`
                : ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {form.selectedEvent ? (
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
      ) : null}

      {form.formError ? (
        <p className="text-sm text-destructive">{form.formError}</p>
      ) : null}

      {form.selectedEvent ? (
        <button
          type="submit"
          disabled={form.submitting}
          className={submitButtonClass}
        >
          {form.submitting ? "PLEASE WAIT…" : submitLabel}
        </button>
      ) : null}
    </form>
  );
}
