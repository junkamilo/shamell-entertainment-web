"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { Loader2, Mail, MessageCircle, Phone } from "lucide-react";

const CONTACT_EMAIL = "info@shamellentertainment.com";

const SERVICE_OPTIONS = [
  { value: "", label: "Select service type" },
  { value: "PRIVATE_GALA", label: "Private Galas" },
  { value: "VIP_EVENT", label: "VIP Events" },
  { value: "BESPOKE", label: "Bespoke Collaborations" },
  { value: "GENERAL", label: "General inquiry" },
] as const;

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  eventDate: string;
  location: string;
  serviceType: string;
  preferences: string;
  message: string;
};

const initialForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  eventDate: "",
  location: "",
  serviceType: "",
  preferences: "",
  message: "",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(values: FormState): Partial<Record<keyof FormState, string>> {
  const e: Partial<Record<keyof FormState, string>> = {};

  if (values.fullName.trim().length < 2) {
    e.fullName = "Name must be at least 2 characters.";
  }

  if (!values.email.trim()) {
    e.email = "Email is required.";
  } else if (!emailRegex.test(values.email.trim())) {
    e.email = "Enter a valid email address.";
  }

  if (values.phone.trim()) {
    const digits = values.phone.replace(/\D/g, "");
    if (digits.length < 7 || values.phone.length > 40) {
      e.phone = "Enter a valid phone number (7+ digits).";
    }
  }

  if (values.eventDate) {
    const d = new Date(values.eventDate);
    if (Number.isNaN(d.getTime())) {
      e.eventDate = "Invalid date.";
    }
  }

  if (values.location.length > 300) {
    e.location = "Location must be at most 300 characters.";
  }

  if (!values.serviceType) {
    e.serviceType = "Please select a service type.";
  }

  if (values.preferences.length > 2000) {
    e.preferences = "Preferences must be at most 2000 characters.";
  }

  if (values.message.trim().length < 10) {
    e.message = "Description must be at least 10 characters.";
  } else if (values.message.length > 4000) {
    e.message = "Description must be at most 4000 characters.";
  }

  return e;
}

export default function ContactInquiryForm() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const apiBaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001",
    [],
  );

  const phoneDisplay = process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "";
  const whatsappE164 = process.env.NEXT_PUBLIC_WHATSAPP_E164 ?? "";

  const errors = useMemo(() => validateForm(form), [form]);

  const shouldShow = useCallback(
    (field: keyof FormState) => Boolean(touched[field] || submitAttempted),
    [touched, submitAttempted],
  );

  const update = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setSuccess(false);
    setApiError(null);
  };

  const blur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSubmitAttempted(true);
    setApiError(null);
    const v = validateForm(form);
    if (Object.keys(v).length > 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          eventDate: form.eventDate || undefined,
          location: form.location.trim() || undefined,
          serviceType: form.serviceType || undefined,
          preferences: form.preferences.trim() || undefined,
          message: form.message.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          Array.isArray(data?.message)
            ? data.message.join(" ")
            : typeof data?.message === "string"
              ? data.message
              : "Could not send your inquiry. Please try again.";
        setApiError(msg);
        return;
      }

      setSuccess(true);
      setForm(initialForm);
      setTouched({});
      setSubmitAttempted(false);
    } catch {
      setApiError("Cannot reach the server. Check that the API is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-left">
      <h2 className="font-brand text-gold text-center text-xl md:text-2xl tracking-[0.16em] mb-2">
        BOOKING INQUIRY
      </h2>
      <p className="text-foreground/65 text-sm font-body text-center mb-8">
        Share your event details. We respond as soon as possible.
      </p>

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <Field
          label="Full name"
          name="fullName"
          value={form.fullName}
          onChange={(v) => update("fullName", v)}
          onBlur={() => blur("fullName")}
          error={shouldShow("fullName") ? errors.fullName : undefined}
          required
        />
        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(v) => update("email", v)}
          onBlur={() => blur("email")}
          error={shouldShow("email") ? errors.email : undefined}
          required
        />
        <Field
          label="Phone"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={(v) => update("phone", v)}
          onBlur={() => blur("phone")}
          error={shouldShow("phone") ? errors.phone : undefined}
          hint="Optional — include country code if outside your region."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field
            label="Event date"
            name="eventDate"
            type="date"
            value={form.eventDate}
            onChange={(v) => update("eventDate", v)}
            onBlur={() => blur("eventDate")}
            error={shouldShow("eventDate") ? errors.eventDate : undefined}
            hint="Optional — approximate is fine."
          />
          <div>
            <label className="block">
              <span className="font-brand text-gold text-xs tracking-[0.14em]">
                Service type <span className="text-red-300">*</span>
              </span>
              <select
                name="serviceType"
                value={form.serviceType}
                onChange={(e) => update("serviceType", e.target.value)}
                onBlur={() => blur("serviceType")}
                required
                className="mt-2 w-full border border-gold/40 bg-black/30 px-4 py-3 text-foreground outline-none focus:border-gold"
              >
                {SERVICE_OPTIONS.map((opt) => (
                  <option key={opt.value || "empty"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
            {shouldShow("serviceType") && errors.serviceType ? (
              <p className="mt-1 text-xs text-red-300" role="alert">
                {errors.serviceType}
              </p>
            ) : null}
          </div>
        </div>
        <Field
          label="Location"
          name="location"
          value={form.location}
          onChange={(v) => update("location", v)}
          onBlur={() => blur("location")}
          error={shouldShow("location") ? errors.location : undefined}
          hint="Venue or city — optional."
        />
        <div>
          <label className="block">
            <span className="font-brand text-gold text-xs tracking-[0.14em]">
              Preferences <span className="text-foreground/40 font-body normal-case">(optional)</span>
            </span>
            <textarea
              name="preferences"
              value={form.preferences}
              onChange={(e) => update("preferences", e.target.value)}
              onBlur={() => blur("preferences")}
              rows={3}
              className="mt-2 w-full border border-gold/40 bg-black/30 px-4 py-3 text-foreground outline-none focus:border-gold resize-y min-h-[88px]"
            />
          </label>
          <div className="flex justify-between mt-1">
            {shouldShow("preferences") && errors.preferences ? (
              <p className="text-xs text-red-300" role="alert">
                {errors.preferences}
              </p>
            ) : (
              <span />
            )}
            <span className="text-[10px] text-foreground/40">{form.preferences.length}/2000</span>
          </div>
        </div>
        <div>
          <label className="block">
            <span className="font-brand text-gold text-xs tracking-[0.14em]">
              Description <span className="text-red-300">*</span>
            </span>
            <textarea
              name="message"
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              onBlur={() => blur("message")}
              required
              rows={6}
              className="mt-2 w-full border border-gold/40 bg-black/30 px-4 py-3 text-foreground outline-none focus:border-gold resize-y min-h-[140px]"
            />
          </label>
          <div className="flex justify-between mt-1">
            {shouldShow("message") && errors.message ? (
              <p className="text-xs text-red-300" role="alert">
                {errors.message}
              </p>
            ) : (
              <span />
            )}
            <span className="text-[10px] text-foreground/40">{form.message.length}/4000</span>
          </div>
        </div>

        {apiError ? (
          <p className="text-sm text-red-300" role="alert">
            {apiError}
          </p>
        ) : null}
        {success ? (
          <p
            className="rounded border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold-light font-body"
            role="status"
          >
            Thank you — your inquiry was sent successfully. We will get back to you shortly.
          </p>
        ) : null}

        <button
          type="submit"
          className="btn-outline-gold w-full font-brand justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Sending...
            </>
          ) : (
            "Submit inquiry"
          )}
        </button>
      </form>

      <div className="mt-10 border-t border-gold/20 pt-8">
        <h3 className="font-brand text-gold text-xs tracking-[0.2em] mb-4 text-center">
          DIRECT CONTACT
        </h3>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch justify-center gap-3">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center justify-center gap-2 border border-gold/35 px-4 py-3 text-xs font-brand tracking-wide text-gold hover:border-gold hover:bg-gold/10 transition-colors"
          >
            <Mail className="h-4 w-4 shrink-0" aria-hidden />
            {CONTACT_EMAIL}
          </a>
          {phoneDisplay ? (
            <a
              href={`tel:${phoneDisplay.replace(/[^\d+]/g, "")}`}
              className="inline-flex items-center justify-center gap-2 border border-gold/35 px-4 py-3 text-xs font-brand tracking-wide text-gold hover:border-gold hover:bg-gold/10 transition-colors"
            >
              <Phone className="h-4 w-4 shrink-0" aria-hidden />
              {phoneDisplay}
            </a>
          ) : (
            <span className="inline-flex items-center justify-center gap-2 border border-gold/20 px-4 py-3 text-xs text-foreground/45 font-body">
              <Phone className="h-4 w-4 shrink-0" aria-hidden />
              Phone on request
            </span>
          )}
          {whatsappE164 ? (
            <a
              href={`https://wa.me/${whatsappE164.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-gold/35 px-4 py-3 text-xs font-brand tracking-wide text-gold hover:border-gold hover:bg-gold/10 transition-colors"
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
              WhatsApp
            </a>
          ) : (
            <span className="inline-flex items-center justify-center gap-2 border border-gold/20 px-4 py-3 text-xs text-foreground/45 font-body">
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
              Set NEXT_PUBLIC_WHATSAPP_E164 for WhatsApp
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  type = "text",
  required,
  hint,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  onBlur: () => void;
  error?: string;
  type?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="block" htmlFor={name}>
        <span className="font-brand text-gold text-xs tracking-[0.14em]">
          {label}{" "}
          {required ? <span className="text-red-300">*</span> : null}
          {!required && !hint ? (
            <span className="text-foreground/40 font-body normal-case">(optional)</span>
          ) : null}
        </span>
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          required={required}
          className="mt-2 w-full border border-gold/40 bg-black/30 px-4 py-3 text-foreground outline-none focus:border-gold"
        />
      </label>
      {hint ? <p className="mt-1 text-[10px] text-foreground/45 font-body">{hint}</p> : null}
      {error ? (
        <p className="mt-1 text-xs text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
