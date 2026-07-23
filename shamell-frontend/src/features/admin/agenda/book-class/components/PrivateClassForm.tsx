"use client";

import ContactDatePickerModal from "@/features/contacto/components/ContactDatePickerModal";
import ContactTimePickerModal from "@/features/contacto/components/ContactTimePickerModal";
import { formatTimeDisplayUs } from "@/lib/contactLogisticsUtils";
import { fieldLabelClass, submitButtonClass } from "../../shared/lib/agendaFormStyles";
import { usePrivateClassForm } from "../hooks/usePrivateClassForm";
import { inputClass } from "../lib/bookClassDisplay";

export const PRIVATE_CLASS_FORM_ID = "shamell-agendar-private-class-form";

export function PrivateClassForm() {
  const {
    fields,
    patch,
    setPaymentMethod,
    submitting,
    datePickerOpen,
    setDatePickerOpen,
    timePickerOpen,
    setTimePickerOpen,
    onSubmit,
  } = usePrivateClassForm();

  return (
    <>
      <form
        id={PRIVATE_CLASS_FORM_ID}
        noValidate
        onSubmit={onSubmit}
        className="shamell-glass-surface space-y-4 md:space-y-6 rounded-2xl p-4 sm:p-5 md:p-8"
      >
        <label className="block">
          <span className={fieldLabelClass}>CLASS TYPE</span>
          <input
            required
            value={fields.classType}
            onChange={(e) => patch({ classType: e.target.value })}
            className={inputClass}
            placeholder="e.g. Private belly dance lesson"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={fieldLabelClass}>DATE</span>
            <button
              type="button"
              onClick={() => setDatePickerOpen(true)}
              className={`${inputClass} text-left`}
            >
              {fields.eventDate || "Choose date"}
            </button>
          </label>
          <label className="block">
            <span className={fieldLabelClass}>START TIME</span>
            <button
              type="button"
              onClick={() => setTimePickerOpen(true)}
              className={`${inputClass} text-left`}
            >
              {fields.eventTimeStart
                ? formatTimeDisplayUs(fields.eventTimeStart)
                : "Choose time"}
            </button>
          </label>
        </div>

        <label className="block">
          <span className={fieldLabelClass}>LOCATION</span>
          <input
            required
            value={fields.location}
            onChange={(e) => patch({ location: e.target.value })}
            className={inputClass}
            placeholder="Address or venue"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className={fieldLabelClass}>CLIENT NAME</span>
            <input
              required
              value={fields.customerName}
              onChange={(e) => patch({ customerName: e.target.value })}
              className={inputClass}
              autoComplete="name"
            />
          </label>
          <label className="block">
            <span className={fieldLabelClass}>EMAIL</span>
            <input
              type="email"
              required
              value={fields.customerEmail}
              onChange={(e) => patch({ customerEmail: e.target.value })}
              className={inputClass}
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className={fieldLabelClass}>PHONE (OPTIONAL)</span>
            <input
              type="tel"
              value={fields.customerPhone}
              onChange={(e) => patch({ customerPhone: e.target.value })}
              className={inputClass}
              autoComplete="tel"
            />
          </label>
        </div>

        <label className="block">
          <span className={fieldLabelClass}>INTERNAL NOTES</span>
          <textarea
            value={fields.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            className={`${inputClass} min-h-[88px]`}
            rows={3}
          />
        </label>

        <label className="block max-w-xs">
          <span className={fieldLabelClass}>PRICE (USD)</span>
          <input
            required
            inputMode="decimal"
            value={fields.amountUsd}
            onChange={(e) => patch({ amountUsd: e.target.value })}
            className={inputClass}
            placeholder="150"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className={fieldLabelClass}>PAYMENT METHOD</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="privatePaymentMethod"
              checked={fields.paymentMethod === "stripe"}
              onChange={() => setPaymentMethod("stripe")}
            />
            Stripe (email payment link to guest)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="privatePaymentMethod"
              checked={fields.paymentMethod === "cash"}
              onChange={() => setPaymentMethod("cash")}
            />
            Cash (reserve immediately)
          </label>
        </fieldset>

        {fields.paymentMethod === "cash" ? (
          <label className="flex items-start gap-2 text-xs text-foreground/75">
            <input
              type="checkbox"
              checked={fields.cashConfirmed}
              onChange={(e) => patch({ cashConfirmed: e.target.checked })}
              className="mt-0.5"
            />
            I confirm cash payment was received from the guest.
          </label>
        ) : null}

        <button type="submit" disabled={submitting} className={submitButtonClass}>
          {submitting
            ? "Processing…"
            : fields.paymentMethod === "cash"
              ? "CONFIRM PRIVATE CLASS"
              : "SEND PAYMENT LINK"}
        </button>
      </form>

      <ContactDatePickerModal
        isOpen={datePickerOpen}
        title="Class date"
        value={fields.eventDate}
        onClose={() => setDatePickerOpen(false)}
        onConfirm={(iso) => {
          patch({ eventDate: iso });
          setDatePickerOpen(false);
        }}
      />
      <ContactTimePickerModal
        isOpen={timePickerOpen}
        title="Start time"
        value={fields.eventTimeStart}
        onClose={() => setTimePickerOpen(false)}
        onConfirm={(hhmm) => {
          patch({ eventTimeStart: hhmm });
          setTimePickerOpen(false);
        }}
      />
    </>
  );
}
