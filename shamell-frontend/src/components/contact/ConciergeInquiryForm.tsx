"use client";

import type { FormEvent, HTMLAttributes } from "react";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import bailarinaLogo from "@/public/01_bailarina.png";

type ConciergeFormData = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  eventDate: string;
  occasionHint: string;
  guestCount: string;
  planningStage: string;
  message: string;
};

const emptyConciergeForm: ConciergeFormData = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  eventDate: "",
  occasionHint: "",
  guestCount: "",
  planningStage: "",
  message: "",
};

const planningStages = [
  { value: "EARLY_IDEA", label: "I have an idea, but need direction" },
  { value: "COMPARING_OPTIONS", label: "I am comparing possible experiences" },
  { value: "DATE_OR_VENUE_READY", label: "I have a date or venue in mind" },
  { value: "JUST_EXPLORING", label: "I am exploring what Shamell offers" },
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateConciergeForm(data: ConciergeFormData): string | null {
  if (data.fullName.trim().length < 2) return "Please enter your full name.";
  if (!emailRegex.test(data.email.trim())) return "Please enter a valid email.";
  if (data.guestCount.trim()) {
    const n = Number(data.guestCount);
    if (!Number.isInteger(n) || n < 1) return "Guest count must be a whole number.";
  }
  if (data.message.trim().length < 10) {
    return "Tell us a little more about the experience you have in mind.";
  }
  return null;
}

export default function ConciergeInquiryForm() {
  const [data, setData] = useState<ConciergeFormData>(emptyConciergeForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, ""),
    [],
  );

  const updateField = (field: keyof ConciergeFormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const validationError = validateConciergeForm(data);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const guestCount = data.guestCount.trim() ? Number(data.guestCount) : undefined;
      const vision = data.message.trim();
      const res = await fetch(`${apiBaseUrl}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName.trim(),
          email: data.email.trim(),
          phone: data.phone.trim() || undefined,
          eventDate: data.eventDate || undefined,
          location: data.location.trim() || undefined,
          serviceType: "GENERAL",
          subject: "Concierge inquiry - client needs guidance",
          message: vision,
          inquiryDetails: {
            entrySource: "concierge_gate",
            conciergeIntent: "needs_guidance",
            planningStage: data.planningStage || undefined,
            occasionHint: data.occasionHint.trim() || undefined,
            guestCount,
            visionSummary: vision.length > 1000 ? vision.slice(0, 1000) : vision,
          },
        }),
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(nestApiErrorMessage(resData, "Could not send your concierge inquiry. Please try again."));
        return;
      }
      setSuccess(true);
      setData(emptyConciergeForm);
    } catch {
      setError("Cannot reach the server. Check that the API is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-emerald-400/25 bg-emerald-400/8 px-6 py-10 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-300" strokeWidth={1.5} aria-hidden />
        <h1 className="font-brand text-3xl tracking-[0.12em] text-gold uppercase">
          Concierge request received
        </h1>
        <p className="mx-auto mt-4 max-w-xl font-body text-sm leading-relaxed text-foreground/72">
          Thank you. Shamell&apos;s team will review your vision and recommend the best experience
          for your event.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="border border-gold/45 bg-black/25 px-5 py-3 font-brand text-xs tracking-[0.16em] text-gold uppercase transition-colors hover:border-gold hover:bg-gold/10"
          >
            Send another inquiry
          </button>
          <Link
            href="/contacto?mode=booking"
            className="border border-white/15 bg-white/5 px-5 py-3 font-brand text-xs tracking-[0.16em] text-foreground/85 uppercase transition-colors hover:border-gold/45 hover:text-gold"
          >
            Continue to booking form
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl text-left">
      <div className="mb-8 text-center">
        <Link
          href="/contacto"
          className="btn-outline-gold mx-auto mb-8 w-fit gap-2 px-5 py-2 font-brand text-[10px] tracking-[0.16em]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to inquiry options
        </Link>
        <Image
          src={bailarinaLogo}
          alt=""
          width={180}
          height={164}
          priority
          className="mx-auto mb-5 h-16 w-auto object-contain drop-shadow-[0_8px_26px_rgba(0,0,0,0.45)] sm:h-20"
          aria-hidden
        />
        <p className="mb-3 font-brand text-xs tracking-[0.26em] text-gold/75 uppercase">
          Concierge inquiry
        </p>
        <h1 className="font-brand text-3xl tracking-[0.14em] text-gold uppercase md:text-5xl">
          Tell us your vision
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-elegant text-lg leading-relaxed text-foreground/78">
          A few essentials are enough. Shamell&apos;s team can recommend the right experience before
          you move into a formal booking request.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-gold/25 bg-black/35 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)] md:p-7"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <ConciergeField
            name="fullName"
            label="Full name"
            value={data.fullName}
            onChange={(value) => updateField("fullName", value)}
            required
          />
          <ConciergeField
            name="email"
            type="email"
            label="Email"
            value={data.email}
            onChange={(value) => updateField("email", value)}
            required
          />
          <ConciergeField
            name="phone"
            label="Phone"
            value={data.phone}
            onChange={(value) => updateField("phone", value)}
            hint="Helpful if the team needs to clarify details quickly."
          />
          <ConciergeField
            name="location"
            label="City or event location"
            value={data.location}
            onChange={(value) => updateField("location", value)}
          />
          <ConciergeField
            name="eventDate"
            type="date"
            label="Tentative date"
            value={data.eventDate}
            onChange={(value) => updateField("eventDate", value)}
          />
          <ConciergeField
            name="guestCount"
            type="number"
            label="Approximate guests"
            value={data.guestCount}
            onChange={(value) => updateField("guestCount", value)}
            min={1}
            inputMode="numeric"
          />
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <ConciergeSelect
            name="planningStage"
            label="Where are you in planning?"
            value={data.planningStage}
            onChange={(value) => updateField("planningStage", value)}
            options={planningStages}
          />
          <ConciergeField
            name="occasionHint"
            label="Occasion idea"
            value={data.occasionHint}
            onChange={(value) => updateField("occasionHint", value)}
            hint="Wedding, birthday, corporate event, private dinner, production, or something custom."
          />
        </div>

        <label className="mt-5 block" htmlFor="message">
          <span className="font-brand text-xs tracking-[0.14em] text-gold">
            Tell us what you have in mind <span className="text-red-300">*</span>
          </span>
          <textarea
            id="message"
            name="message"
            value={data.message}
            onChange={(e) => updateField("message", e.target.value)}
            required
            rows={7}
            maxLength={4000}
            className="mt-2 w-full resize-y border border-gold/40 bg-black/30 px-4 py-3 font-body text-foreground outline-none transition-colors focus:border-gold"
            placeholder="Describe the feeling, setting, audience, theme, or any inspiration you already have."
          />
        </label>

        {error ? (
          <p className="mt-4 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-xs leading-relaxed text-foreground/48">
            This creates a concierge request, not a confirmed reservation.
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-12 items-center justify-center border border-gold/55 bg-gold/10 px-7 py-3 font-brand text-xs tracking-[0.18em] text-gold uppercase transition-colors hover:border-gold hover:bg-gold/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Sending
              </span>
            ) : (
              "Send concierge inquiry"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function ConciergeField({
  name,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  hint,
  min,
  inputMode,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  hint?: string;
  min?: number;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <div>
      <label className="block" htmlFor={name}>
        <span className="font-brand text-xs tracking-[0.14em] text-gold">
          {label}{" "}
          {required ? <span className="text-red-300">*</span> : <span className="font-body text-foreground/40 normal-case">(optional)</span>}
        </span>
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          min={min}
          inputMode={inputMode}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="mt-2 w-full border border-gold/40 bg-black/30 px-4 py-3 text-foreground outline-none transition-colors focus:border-gold"
        />
      </label>
      {hint ? <p className="mt-1 font-body text-[10px] text-foreground/45">{hint}</p> : null}
    </div>
  );
}

function ConciergeSelect({
  name,
  label,
  value,
  onChange,
  options,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block" htmlFor={name}>
        <span className="font-brand text-xs tracking-[0.14em] text-gold">
          {label} <span className="font-body text-foreground/40 normal-case">(optional)</span>
        </span>
        <select
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full border border-gold/40 bg-black/30 px-4 py-3 text-foreground outline-none transition-colors focus:border-gold"
        >
          <option value="">Select the closest option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
