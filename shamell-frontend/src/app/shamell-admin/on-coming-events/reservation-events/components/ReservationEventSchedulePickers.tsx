"use client";

import ContactDatePickerModal from "@/app/contacto/components/ContactDatePickerModal";
import ContactTimePickerModal from "@/app/contacto/components/ContactTimePickerModal";
import { ADMIN_NESTED_PICKER_OVERLAY_Z_CLASS } from "@/components/admin/adminModalLayers";

export type ScheduleDateTarget = "salesStart" | "salesEnd" | "eventDay" | null;
export type ScheduleTimeTarget = "eventStart" | "eventEnd" | "recurStart" | "recurEnd" | null;

type Props = {
  dateTarget: ScheduleDateTarget;
  timeTarget: ScheduleTimeTarget;
  salesStartDate: string;
  salesEndDate: string;
  eventDate: string;
  eventStartTime: string;
  eventEndTime: string;
  recurringStartTime: string;
  recurringEndTime: string;
  minSelectableIso: string;
  onCloseDate: () => void;
  onCloseTime: () => void;
  onSalesStartDate: (iso: string) => void;
  onSalesEndDate: (iso: string) => void;
  onEventDate: (iso: string) => void;
  onEventStartTime: (hhmm: string) => void;
  onEventEndTime: (hhmm: string) => void;
  onRecurStartTime: (hhmm: string) => void;
  onRecurEndTime: (hhmm: string) => void;
};

export function ReservationEventSchedulePickers({
  dateTarget,
  timeTarget,
  salesStartDate,
  salesEndDate,
  eventDate,
  eventStartTime,
  eventEndTime,
  recurringStartTime,
  recurringEndTime,
  minSelectableIso,
  onCloseDate,
  onCloseTime,
  onSalesStartDate,
  onSalesEndDate,
  onEventDate,
  onEventStartTime,
  onEventEndTime,
  onRecurStartTime,
  onRecurEndTime,
}: Props) {
  const z = ADMIN_NESTED_PICKER_OVERLAY_Z_CLASS;
  return (
    <>
      <ContactDatePickerModal
        isOpen={dateTarget === "salesStart"}
        title="Sales start date"
        value={salesStartDate}
        onClose={onCloseDate}
        onConfirm={onSalesStartDate}
        minSelectableIso={minSelectableIso}
        overlayZClass={z}
      />
      <ContactDatePickerModal
        isOpen={dateTarget === "salesEnd"}
        title="Sales end date"
        value={salesEndDate}
        onClose={onCloseDate}
        onConfirm={onSalesEndDate}
        minSelectableIso={minSelectableIso}
        overlayZClass={z}
      />
      <ContactDatePickerModal
        isOpen={dateTarget === "eventDay"}
        title="Event date"
        value={eventDate}
        onClose={onCloseDate}
        onConfirm={onEventDate}
        minSelectableIso={minSelectableIso}
        overlayZClass={z}
      />
      <ContactTimePickerModal
        isOpen={timeTarget === "eventStart"}
        title="Event start time"
        value={eventStartTime}
        onClose={onCloseTime}
        onConfirm={onEventStartTime}
        overlayZClass={z}
      />
      <ContactTimePickerModal
        isOpen={timeTarget === "eventEnd"}
        title="Event end time"
        value={eventEndTime}
        onClose={onCloseTime}
        onConfirm={onEventEndTime}
        overlayZClass={z}
      />
      <ContactTimePickerModal
        isOpen={timeTarget === "recurStart"}
        title="Start time"
        value={recurringStartTime}
        onClose={onCloseTime}
        onConfirm={onRecurStartTime}
        overlayZClass={z}
      />
      <ContactTimePickerModal
        isOpen={timeTarget === "recurEnd"}
        title="End time"
        value={recurringEndTime}
        onClose={onCloseTime}
        onConfirm={onRecurEndTime}
        overlayZClass={z}
      />
    </>
  );
}
