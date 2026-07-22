"use client";

import Link from "next/link";
import {
  ON_COMING_EVENTS_SITE_TAB_RESERVATION,
  onComingEventsSiteAdminHref,
} from "@/lib/onComingEventsRoutes";
import type { ReservationEventTemplate } from "../types/reservationEventTemplate.types";

type Props = {
  templates: ReservationEventTemplate[];
  loading: boolean;
  value: string;
  onChange: (templateId: string) => void;
  disabled?: boolean;
};

export function ReservationEventTemplateField({
  templates,
  loading,
  value,
  onChange,
  disabled,
}: Props) {
  const selected = templates.find((t) => t.id === value);

  return (
    <div className="block">
      <label className="block">
        <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">
          RESERVATION EVENT
        </span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading || templates.length === 0}
          className="mt-2 w-full rounded-xl border border-gold/30 bg-black/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">Select a reservation event…</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      {loading ? (
        <p className="mt-2 text-xs text-foreground/55">Loading schedules…</p>
      ) : null}

      {!loading && templates.length === 0 ? (
        <p className="mt-2 text-xs text-foreground/65">
          No reservation events yet. Create one under{" "}
          <Link
            href={onComingEventsSiteAdminHref(ON_COMING_EVENTS_SITE_TAB_RESERVATION)}
            className="text-gold underline hover:text-gold/90"
          >
            On Coming Events → Reservation event
          </Link>{" "}
          before adding an upcoming event.
        </p>
      ) : null}

      {selected ? (
        <div className="mt-3 rounded-lg border border-gold/15 bg-black/20 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-gold/25 px-2 py-0.5 font-brand text-[9px] tracking-wider text-gold/80">
              {selected.scheduleMode === "FIXED_EVENT" ? "Fixed" : "Recurring"}
            </span>
          </div>
          {selected.summary ? (
            <p className="mt-2 text-xs text-foreground/70">{selected.summary}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
