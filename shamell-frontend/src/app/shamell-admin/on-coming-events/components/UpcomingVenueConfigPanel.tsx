"use client";

import { useCallback, useEffect, useState } from "react";
import { getEventsBearerToken } from "@/app/shamell-admin/events/lib/eventsAuth";
import { toast } from "@/hooks/use-toast";
import { useReservationEventTemplateOptions } from "../reservation-events/hooks/useReservationEventTemplateOptions";
import {
  fetchAdminVenueConfig,
  patchAdminVenueConfig,
} from "../services/patchAdminVenueConfig";

type Props = { eventId: string };

export function UpcomingVenueConfigPanel({ eventId }: Props) {
  const { templates, loading: templatesLoading } = useReservationEventTemplateOptions(
    true,
    "VENUE_SEATING",
  );
  const [templateId, setTemplateId] = useState("");
  const [linkedName, setLinkedName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const token = getEventsBearerToken();
    if (!token) return;
    setLoading(true);
    const result = await fetchAdminVenueConfig(token, eventId);
    setLoading(false);
    if (!result.ok) return;
    const id = result.config?.reservationEventTemplateId ?? "";
    setTemplateId(id);
    setLinkedName(result.config?.reservationEventTemplate?.name ?? null);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveTemplate = async () => {
    if (!templateId) {
      toast({
        variant: "destructive",
        title: "Select a reservation event",
        description: "Choose a schedule template from the list.",
      });
      return;
    }
    const token = getEventsBearerToken();
    if (!token) return;
    setSaving(true);
    const result = await patchAdminVenueConfig(token, eventId, {
      reservationEventTemplateId: templateId,
    });
    setSaving(false);
    if (!result.ok) {
      toast({
        variant: "destructive",
        title: "Could not link schedule",
        description: result.message,
      });
      return;
    }
    toast({ title: "Reservation schedule linked" });
    await load();
  };

  const selected = templates.find((t) => t.id === templateId);

  return (
    <div className="mt-6 rounded-xl border border-gold/25 p-4">
      <h3 className="font-brand text-xs tracking-[0.16em] text-gold">RESERVATION SCHEDULE</h3>
      <p className="mt-2 text-sm text-foreground/70">
        Link this upcoming event to a reservation event template (dates, times, and weekdays).
      </p>

      {loading ? (
        <p className="mt-3 text-xs text-foreground/55">Loading…</p>
      ) : (
        <>
          {linkedName && selected?.id === templateId ? (
            <p className="mt-3 text-xs text-gold/80">
              Currently linked: <span className="text-gold">{linkedName}</span>
              {selected.scheduleMode ? ` (${selected.scheduleMode === "FIXED_EVENT" ? "Fixed" : "Recurring"})` : ""}
              {selected.summary ? ` — ${selected.summary}` : ""}
            </p>
          ) : null}

          <label className="mt-4 block">
            <span className="font-brand text-[11px] tracking-[0.2em] text-gold/95">
              RESERVATION EVENT
            </span>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              disabled={templatesLoading}
              className="mt-2 w-full rounded-xl border border-gold/30 bg-black/30 px-4 py-3 text-sm text-foreground outline-none focus:border-gold"
            >
              <option value="">Select a reservation event…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          {templates.length === 0 && !templatesLoading ? (
            <p className="mt-2 text-xs text-foreground/55">
              Create reservation events under the Reservation event tab first.
            </p>
          ) : null}

          <button
            type="button"
            disabled={saving || !templateId}
            onClick={() => void saveTemplate()}
            className="mt-3 rounded-lg border border-gold/35 px-4 py-2 font-brand text-xs tracking-[0.12em] text-gold uppercase disabled:opacity-50"
          >
            {saving ? "Saving…" : "Apply schedule"}
          </button>
        </>
      )}
    </div>
  );
}
