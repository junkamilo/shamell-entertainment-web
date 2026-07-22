"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { toast } from "@/hooks/use-toast";
import { createAdminReservationEventTemplate } from "../services/createAdminReservationEventTemplate";
import { deleteAdminReservationEventTemplate } from "../services/deleteAdminReservationEventTemplate";
import { fetchAdminReservationEventTemplates } from "../services/fetchAdminReservationEventTemplates";
import { patchAdminReservationEventTemplate } from "../services/patchAdminReservationEventTemplate";
import type {
  ReservationEventTemplate,
  ReservationEventTemplateBody,
} from "../types/reservationEventTemplate.types";
import { ReservationEventFormModal } from "./ReservationEventFormModal";

export function ReservationEventsPanel() {
  const [templates, setTemplates] = useState<ReservationEventTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ReservationEventTemplate | null>(null);

  const load = useCallback(async () => {
    const token = getAdminBearerToken();
    if (!token) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchAdminReservationEventTemplates(token);
      if (!result.ok) {
        toast({
          variant: "destructive",
          title: "Could not load",
          description: result.message,
        });
        setTemplates([]);
        return;
      }
      setTemplates(result.templates);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row: ReservationEventTemplate) => {
    setEditing(row);
    setModalOpen(true);
  };

  const onSubmit = async (body: ReservationEventTemplateBody) => {
    const token = getAdminBearerToken();
    if (!token) return;

    setIsSubmitting(true);
    const result =
      editing ?
        await patchAdminReservationEventTemplate(token, editing.id, body)
      : await createAdminReservationEventTemplate(token, body);
    setIsSubmitting(false);

    if (!result.ok || !result.template) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: result.message,
      });
      return;
    }

    toast({
      title: editing ? "Reservation event updated" : "Reservation event created",
    });
    setModalOpen(false);
    setEditing(null);
    await load();
  };

  const onDelete = async (row: ReservationEventTemplate) => {
    if (!window.confirm(`Delete "${row.name}"?`)) return;
    const token = getAdminBearerToken();
    if (!token) return;
    const result = await deleteAdminReservationEventTemplate(token, row.id);
    if (!result.ok) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: result.message,
      });
      return;
    }
    toast({ title: "Deleted" });
    await load();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground/75">
          Create named schedules (dates, times, weekdays). Link them when creating venue seating
          upcoming events.
        </p>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg border border-gold/35 bg-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gold hover:bg-gold/20"
        >
          <Plus className="h-3.5 w-3.5" />
          New reservation event
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10 text-gold">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gold/20 px-4 py-8 text-center text-sm text-foreground/55">
          No reservation events yet. Create one to use in upcoming venue events.
        </p>
      ) : (
        <ul className="space-y-3">
          {templates.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gold/15 bg-black/20 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-brand text-sm tracking-[0.1em] text-gold">{row.name}</p>
                  <span className="rounded-full border border-gold/25 px-2 py-0.5 font-brand text-[9px] tracking-wider text-gold/80">
                    {row.scheduleMode === "FIXED_EVENT" ? "FIXED" : "RECURRING"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-foreground/65">{row.summary}</p>
                {row.activeDayLabels.length > 0 ? (
                  <p className="mt-2 text-[10px] uppercase tracking-wider text-foreground/45">
                    {row.activeDayLabels.join(" · ")}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="rounded-lg border border-gold/25 p-2 text-gold hover:bg-gold/10"
                  aria-label={`Edit ${row.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void onDelete(row)}
                  className="rounded-lg border border-gold/25 p-2 text-foreground/60 hover:border-red-400/40 hover:text-red-300"
                  aria-label={`Delete ${row.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ReservationEventFormModal
        isOpen={modalOpen}
        editing={editing}
        isSubmitting={isSubmitting}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={(body) => void onSubmit(body)}
      />
    </div>
  );
}
