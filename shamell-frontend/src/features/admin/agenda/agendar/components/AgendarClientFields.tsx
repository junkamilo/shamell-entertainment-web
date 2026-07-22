"use client";

import {
  sanitizeIntegerInput,
  sanitizeNameInput,
  sanitizePhoneInput,
} from "../lib/agendarValidation";
import { fieldLabelClass } from "../../shared/lib/agendaFormStyles";
import type {
  AgendarClientFieldsProps,
  AgendarLocationFieldProps,
} from "../types/agendarComponents.types";

export function AgendarClientFields({ form }: AgendarClientFieldsProps) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className={fieldLabelClass}>CLIENT — NAME</span>
          <input
            required
            value={form.guestFullName}
            onChange={(e) => form.setGuestFullName(sanitizeNameInput(e.target.value))}
            minLength={3}
            maxLength={90}
            className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-3 font-body text-base text-foreground placeholder:text-foreground outline-none focus:border-gold"
            placeholder="Client full name"
          />
        </label>
        <label className="block">
          <span className={fieldLabelClass}>EMAIL</span>
          <input
            required
            type="email"
            value={form.guestEmail}
            onChange={(e) => form.setGuestEmail(e.target.value)}
            maxLength={120}
            className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-3 font-body text-base text-foreground placeholder:text-foreground outline-none focus:border-gold"
            placeholder="name@example.com"
          />
        </label>
        <label className="block">
          <span className={fieldLabelClass}>PHONE</span>
          <input
            required
            value={form.guestPhone}
            onChange={(e) => form.setGuestPhone(sanitizePhoneInput(e.target.value))}
            minLength={10}
            maxLength={20}
            className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-3 font-body text-base text-foreground placeholder:text-foreground outline-none focus:border-gold"
            placeholder="+1 (555) 000-0000"
          />
        </label>
      </div>

      <label className="block">
        <span className={fieldLabelClass}>GUESTS (APPROX.)</span>
        <input
          required
          type="number"
          min={1}
          max={20000}
          value={form.guestCount}
          onChange={(e) => form.setGuestCount(sanitizeIntegerInput(e.target.value))}
          className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-3 font-body text-base text-foreground placeholder:text-foreground outline-none focus:border-gold"
          placeholder="e.g. 120"
        />
      </label>

      <label className="block">
        <span className={fieldLabelClass}>INTERNAL NOTES</span>
        <textarea
          value={form.notes}
          onChange={(e) => form.setNotes(e.target.value)}
          rows={3}
          maxLength={1000}
          className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-3 font-body text-base text-foreground placeholder:text-foreground outline-none focus:border-gold"
          placeholder="Extra details for this booking..."
        />
      </label>
    </>
  );
}

export function AgendarLocationField({ form }: AgendarLocationFieldProps) {
  return (
    <label className="block">
      <span className={fieldLabelClass}>LOCATION</span>
      <input
        required
        value={form.location}
        onChange={(e) => form.setLocation(e.target.value)}
        minLength={3}
        maxLength={120}
        className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-3 font-body text-base text-foreground placeholder:text-foreground outline-none focus:border-gold"
        placeholder="City or venue"
      />
    </label>
  );
}
