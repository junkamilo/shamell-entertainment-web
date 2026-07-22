"use client";

import { Modal } from "@/components/admin/overlays";
import { useCallback, useEffect, useState } from "react";
import type { ReservationEventTemplateBody } from "../types/reservationEventTemplate.types";
import type { ReservationEventTemplate } from "../types/reservationEventTemplate.types";
import {
  emptyScheduleForm,
  ReservationEventScheduleSections,
  scheduleFormFromTemplate,
  type ScheduleFormState,
} from "./ReservationEventScheduleSections";

type Props = {
  isOpen: boolean;
  editing: ReservationEventTemplate | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (body: ReservationEventTemplateBody) => void;
};

const textInputClass =
  "mt-1 w-full rounded-lg border border-gold/20 bg-black/30 px-3 py-2 text-sm text-foreground";

function toSubmitBody(name: string, schedule: ScheduleFormState): ReservationEventTemplateBody {
  const base = {
    name: name.trim(),
    timezone: "America/New_York",
    scheduleMode: schedule.scheduleMode,
  };
  if (schedule.scheduleMode === "FIXED_EVENT") {
    return {
      ...base,
      salesStartDate: schedule.salesStartDate,
      salesEndDate: schedule.salesEndDate,
      eventDate: schedule.eventDate,
      eventStartTime: schedule.eventStartTime,
      eventEndTime: schedule.eventEndTime,
    };
  }
  return {
    ...base,
    weekdays: schedule.weekdays,
    recurringStartTime: schedule.recurringStartTime,
    recurringEndTime: schedule.recurringEndTime,
  };
}

export function ReservationEventFormModal({
  isOpen,
  editing,
  isSubmitting,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [schedule, setSchedule] = useState<ScheduleFormState>(emptyScheduleForm);

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setName(editing.name);
      setSchedule(scheduleFormFromTemplate(editing));
    } else {
      setName("");
      setSchedule(emptyScheduleForm());
    }
  }, [isOpen, editing]);

  const handleSubmit = useCallback(() => {
    onSubmit(toSubmitBody(name, schedule));
  }, [name, onSubmit, schedule]);

  return (
    <Modal
      title={editing ? "Edit reservation event" : "New reservation event"}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="space-y-5">
        <label className="block text-xs text-foreground/70">
          Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Friday Lounge — Spring"
            className={textInputClass}
            maxLength={120}
          />
        </label>

        <ReservationEventScheduleSections value={schedule} onChange={setSchedule} />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gold/30 px-5 py-3 text-sm text-foreground/80"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="rounded-xl border border-gold/35 bg-gold/15 px-5 py-3 font-brand text-sm tracking-[0.08em] text-gold disabled:opacity-60"
          >
            {isSubmitting ? "Saving…" : editing ? "Save changes" : "Create"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
