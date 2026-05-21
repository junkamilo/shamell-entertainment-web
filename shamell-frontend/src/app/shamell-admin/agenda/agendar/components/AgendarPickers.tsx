"use client";

import ContactDatePickerModal from "@/app/contacto/components/ContactDatePickerModal";
import ContactTimePickerModal from "@/app/contacto/components/ContactTimePickerModal";
import type { useAgendarAvailability } from "../hooks/useAgendarAvailability";
import type { AgendarFormState } from "../hooks/useAgendarFormState";
import type { OccupiedRange } from "../types/agendar.types";

type AgendarPickersProps = {
  form: AgendarFormState;
  availability: ReturnType<typeof useAgendarAvailability>;
  occupiedRanges: OccupiedRange[];
  isMobileLayout: boolean;
};

export function AgendarPickers({
  form,
  availability,
  occupiedRanges,
  isMobileLayout,
}: AgendarPickersProps) {
  const overlayZ = isMobileLayout ? "z-[220]" : "z-[100]";
  const timeOverlayZ = isMobileLayout ? "z-[220]" : "z-100";

  return (
    <>
      <ContactDatePickerModal
        isOpen={form.datePickerOpen}
        title="Event date"
        value={form.eventDateIso}
        onClose={() => form.setDatePickerOpen(false)}
        onConfirm={(iso) => form.setEventDateIso(iso)}
        blockedIsoDates={availability.blockedIsoDates}
        blockedReasonByIso={availability.blockedReasonByIso}
        minSelectableIso={availability.minSelectableIso}
        overlayZClass={overlayZ}
      />
      <ContactTimePickerModal
        isOpen={form.timePickerWhich === "start"}
        title="Event start time"
        value={form.eventTimeStart}
        onClose={() => form.setTimePickerWhich(null)}
        onConfirm={(hhmm) => form.setEventTimeStart(hhmm)}
        timeClamp={availability.startTimeClamp}
        blockedRanges={occupiedRanges}
        overlayZClass={timeOverlayZ}
      />
      <ContactTimePickerModal
        isOpen={form.timePickerWhich === "end"}
        title="Event end time"
        value={form.eventTimeEnd}
        onClose={() => form.setTimePickerWhich(null)}
        onConfirm={(hhmm) => form.setEventTimeEnd(hhmm)}
        timeClamp={availability.startTimeClamp}
        blockedRanges={occupiedRanges}
        overlayZClass={timeOverlayZ}
      />
    </>
  );
}
