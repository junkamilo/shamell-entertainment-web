"use client";

import type { FormEvent, HTMLAttributes } from "react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { nestApiErrorMessage } from "@/lib/nestApiErrorMessage";
import bailarinaLogo from "@/public/01_bailarina.png";
import ContactDatePickerModal from "@/components/contact/ContactDatePickerModal";
import InquirySubmitFeedbackLayer, {
  type InquirySubmitFeedbackPhase,
} from "@/components/contact/InquirySubmitFeedbackLayer";
import { formatDateDisplayUs } from "@/components/contact/contactLogisticsUtils";

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

const conciergeDatePickerTriggerClass =
  "mt-2 flex min-h-[48px] w-full items-center justify-between gap-3 border border-gold/40 bg-black/30 px-4 py-3 text-left text-sm text-foreground outline-none transition hover:border-gold focus:border-gold focus:ring-1 focus:ring-gold/30";

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
  const router = useRouter();
  const [data, setData] = useState<ConciergeFormData>(emptyConciergeForm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitFeedbackPhase, setSubmitFeedbackPhase] = useState<InquirySubmitFeedbackPhase>("idle");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, ""),
    [],
  );

  const handleConciergeSubmitComplete = useCallback(() => {
    setData(emptyConciergeForm);
    setSubmitFeedbackPhase("idle");
    router.replace("/");
  }, [router]);

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
    setSubmitFeedbackPhase("sending");
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
        setSubmitFeedbackPhase("idle");
        return;
      }
      setSubmitFeedbackPhase("done");
    } catch {
      setError("Cannot reach the server. Check that the API is running.");
      setSubmitFeedbackPhase("idle");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative w-full">
      <nav className="absolute left-0 top-0 z-10" aria-label="Inquiry navigation">
        <Link
          href="/contacto"
          className="btn-outline-gold inline-flex max-w-[min(100%,20rem)] shrink-0 flex-wrap items-center gap-2 px-4 py-2 font-brand text-[10px] tracking-[0.16em] sm:max-w-none sm:px-5"
        >
          <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Back to inquiry options
        </Link>
      </nav>

      <div className="mx-auto max-w-4xl text-left">
        <div className="mb-8 pt-12 text-center sm:pt-11 md:pt-10">
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
          <div>
            <span className="font-brand text-xs tracking-[0.14em] text-gold">
              Tentative date{" "}
              <span className="font-body text-foreground/40 normal-case">(optional)</span>
            </span>
            <button
              type="button"
              onClick={() => setDatePickerOpen(true)}
              className={conciergeDatePickerTriggerClass}
            >
              <span className={data.eventDate ? "font-body text-foreground" : "font-body text-foreground/45"}>
                {data.eventDate ? formatDateDisplayUs(data.eventDate) : "Select date"}
              </span>
              <span className="shrink-0 font-brand text-[10px] tracking-[0.14em] text-gold/75">CALENDAR</span>
            </button>
            {data.eventDate ? (
              <button
                type="button"
                onClick={() => updateField("eventDate", "")}
                className="mt-1.5 font-body text-[10px] text-foreground/45 underline decoration-foreground/25 underline-offset-2 transition hover:text-gold"
              >
                Clear date
              </button>
            ) : null}
          </div>
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
          <span className="font-brand text-sm tracking-[0.12em] text-gold sm:text-base sm:tracking-[0.14em]">
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
            className="mt-2 min-h-[180px] w-full resize-y border border-gold/40 bg-black/30 px-4 py-3.5 font-body text-base leading-relaxed text-foreground outline-none transition-colors placeholder:text-foreground/45 placeholder:leading-relaxed focus:border-gold sm:min-h-[200px] sm:px-5 sm:py-4 sm:text-lg"
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
            disabled={isSubmitting || submitFeedbackPhase !== "idle"}
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

        <ContactDatePickerModal
          isOpen={datePickerOpen}
          title="Tentative date"
          value={data.eventDate}
          onClose={() => setDatePickerOpen(false)}
          onConfirm={(iso) => updateField("eventDate", iso)}
        />
        <InquirySubmitFeedbackLayer phase={submitFeedbackPhase} onAccept={handleConciergeSubmitComplete} />
      </div>
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

const conciergeSelectTriggerClass =
  "mt-2 flex min-h-[48px] w-full items-center justify-between gap-3 border border-gold/40 bg-black/30 px-4 py-3 text-left font-body text-sm outline-none transition hover:border-gold focus:border-gold focus:ring-1 focus:ring-gold/30";

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
  const uid = useId();
  const listId = `${uid}-list`;
  const triggerId = `${uid}-trigger`;
  const labelId = `${uid}-label`;
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const selected = options.find((o) => o.value === value);
  const summaryText = selected?.label ?? "Select the closest option";
  const rows: { value: string; label: string }[] = [
    { value: "", label: "Select the closest option" },
    ...options,
  ];

  const activeDescendantId =
    value === "" ? `${listId}-opt-empty` : `${listId}-opt-${value.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

  const pick = (next: string) => {
    onChange(next);
    close();
  };

  return (
    <div ref={containerRef} className="relative">
      <input type="hidden" name={name} value={value} readOnly aria-hidden />
      <div className="block">
        <span id={labelId} className="font-brand text-xs tracking-[0.14em] text-gold">
          {label} <span className="font-body text-foreground/40 normal-case">(optional)</span>
        </span>
        <motion.button
          type="button"
          id={triggerId}
          aria-labelledby={labelId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listId}
          onClick={() => setOpen((v) => !v)}
          whileTap={{ scale: 0.995 }}
          transition={{ type: "spring", stiffness: 520, damping: 38 }}
          className={cn(conciergeSelectTriggerClass, open && "border-gold ring-1 ring-gold/25")}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              value ? "text-foreground" : "text-foreground/50",
            )}
          >
            {summaryText}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 text-gold/80 transition-transform duration-200", open && "rotate-180")}
            strokeWidth={1.75}
            aria-hidden
          />
        </motion.button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            key={`${listId}-panel`}
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            aria-activedescendant={activeDescendantId}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { type: "spring", damping: 26, stiffness: 340, mass: 0.75 },
            }}
            exit={{ opacity: 0, y: -4, scale: 0.99, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } }}
            className="shamell-scrollbar absolute left-0 right-0 top-[calc(100%+6px)] z-80 max-h-[min(18rem,50vh)] origin-top overflow-y-auto rounded-sm border border-gold/45 bg-[rgba(8,3,12,0.97)] shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-md"
          >
            {rows.map((row) => {
              const isEmpty = row.value === "";
              const isSel = row.value === value;
              const optId = isEmpty ? `${listId}-opt-empty` : `${listId}-opt-${row.value.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
              return (
                <button
                  key={isEmpty ? "__empty" : row.value}
                  type="button"
                  role="option"
                  aria-selected={isSel}
                  id={optId}
                  onClick={() => pick(row.value)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-gold/12 px-4 py-3 text-left font-body text-sm leading-snug transition-colors last:border-b-0",
                    "text-foreground/90 hover:bg-gold/10 hover:text-foreground",
                    isSel && "bg-gold/14 text-gold",
                    isEmpty && !isSel && "text-foreground/50",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border transition-colors",
                      isSel ? "border-gold/60 bg-gold/20 text-gold" : "border-gold/25 bg-black/40 text-transparent",
                    )}
                    aria-hidden
                  >
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  <span className="min-w-0 flex-1">{row.label}</span>
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
