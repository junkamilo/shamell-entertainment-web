"use client";

import ContactDatePickerModal from "@/app/contacto/components/ContactDatePickerModal";
import ContactTimePickerModal from "@/app/contacto/components/ContactTimePickerModal";

/** Legacy singleton sales window (deprecated). */
const ADMIN_SALES_DATE_MIN_ISO = "2000-01-01";

export type VenueLayoutDatePickerTarget = "open" | "close" | "start" | "end" | null;
export type VenueLayoutTimePickerTarget = "open" | "close" | "start" | "end" | null;

type Props = {
  datePickerTarget: VenueLayoutDatePickerTarget;
  timePickerTarget: VenueLayoutTimePickerTarget;
  openDate: string;
  closeDate: string;
  openTime: string;
  closeTime: string;
  /** When set, calendar cannot select dates before this (YYYY-MM-DD). */
  minSelectableIso?: string;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  onCloseDatePicker: () => void;
  onCloseTimePicker: () => void;
  onConfirmOpenDate?: (iso: string) => void;
  onConfirmCloseDate?: (iso: string) => void;
  onConfirmOpenTime?: (hhmm: string) => void;
  onConfirmCloseTime?: (hhmm: string) => void;
  onConfirmStartDate?: (iso: string) => void;
  onConfirmEndDate?: (iso: string) => void;
  onConfirmStartTime?: (hhmm: string) => void;
  onConfirmEndTime?: (hhmm: string) => void;
  /** Use ADMIN_NESTED_PICKER_OVERLAY_Z_CLASS when pickers open inside AdminModal (z-200). */
  overlayZClass?: string;
};

export function VenueLayoutReservationPickers({
  datePickerTarget,
  timePickerTarget,
  openDate,
  closeDate,
  openTime,
  closeTime,
  minSelectableIso = ADMIN_SALES_DATE_MIN_ISO,
  startDate = "",
  endDate = "",
  startTime = "",
  endTime = "",
  onCloseDatePicker,
  onCloseTimePicker,
  onConfirmOpenDate,
  onConfirmCloseDate,
  onConfirmOpenTime,
  onConfirmCloseTime,
  onConfirmStartDate,
  onConfirmEndDate,
  onConfirmStartTime,
  onConfirmEndTime,
  overlayZClass = "z-[100]",
}: Props) {
  return (
    <>
      <ContactDatePickerModal
        isOpen={datePickerTarget === "open"}
        title="Sales open date"
        value={openDate}
        onClose={onCloseDatePicker}
        onConfirm={onConfirmOpenDate ?? (() => {})}
        minSelectableIso={minSelectableIso}
        overlayZClass={overlayZClass}
      />
      <ContactDatePickerModal
        isOpen={datePickerTarget === "close"}
        title="Sales close date"
        value={closeDate}
        onClose={onCloseDatePicker}
        onConfirm={onConfirmCloseDate ?? (() => {})}
        minSelectableIso={minSelectableIso}
        overlayZClass={overlayZClass}
      />
      <ContactDatePickerModal
        isOpen={datePickerTarget === "start"}
        title="Start date"
        value={startDate}
        onClose={onCloseDatePicker}
        onConfirm={onConfirmStartDate ?? (() => {})}
        minSelectableIso={minSelectableIso}
        overlayZClass={overlayZClass}
      />
      <ContactDatePickerModal
        isOpen={datePickerTarget === "end"}
        title="End date"
        value={endDate}
        onClose={onCloseDatePicker}
        onConfirm={onConfirmEndDate ?? (() => {})}
        minSelectableIso={minSelectableIso}
        overlayZClass={overlayZClass}
      />
      <ContactTimePickerModal
        isOpen={timePickerTarget === "open"}
        title="Sales open time"
        value={openTime}
        onClose={onCloseTimePicker}
        onConfirm={onConfirmOpenTime ?? (() => {})}
        overlayZClass={overlayZClass}
      />
      <ContactTimePickerModal
        isOpen={timePickerTarget === "close"}
        title="Sales close time"
        value={closeTime}
        onClose={onCloseTimePicker}
        onConfirm={onConfirmCloseTime ?? (() => {})}
        overlayZClass={overlayZClass}
      />
      <ContactTimePickerModal
        isOpen={timePickerTarget === "start"}
        title="Start time"
        value={startTime}
        onClose={onCloseTimePicker}
        onConfirm={onConfirmStartTime ?? (() => {})}
        overlayZClass={overlayZClass}
      />
      <ContactTimePickerModal
        isOpen={timePickerTarget === "end"}
        title="End time"
        value={endTime}
        onClose={onCloseTimePicker}
        onConfirm={onConfirmEndTime ?? (() => {})}
        overlayZClass={overlayZClass}
      />
    </>
  );
}
