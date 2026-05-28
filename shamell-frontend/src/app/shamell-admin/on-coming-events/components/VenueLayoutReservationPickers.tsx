"use client";

import ContactDatePickerModal from "@/app/contacto/components/ContactDatePickerModal";
import ContactTimePickerModal from "@/app/contacto/components/ContactTimePickerModal";

/** Admin sales window: allow past dates when editing an existing event. */
const ADMIN_SALES_DATE_MIN_ISO = "2000-01-01";

export type VenueLayoutDatePickerTarget = "open" | "close" | null;
export type VenueLayoutTimePickerTarget = "open" | "close" | null;

type Props = {
  datePickerTarget: VenueLayoutDatePickerTarget;
  timePickerTarget: VenueLayoutTimePickerTarget;
  openDate: string;
  closeDate: string;
  openTime: string;
  closeTime: string;
  onCloseDatePicker: () => void;
  onCloseTimePicker: () => void;
  onConfirmOpenDate: (iso: string) => void;
  onConfirmCloseDate: (iso: string) => void;
  onConfirmOpenTime: (hhmm: string) => void;
  onConfirmCloseTime: (hhmm: string) => void;
};

export function VenueLayoutReservationPickers({
  datePickerTarget,
  timePickerTarget,
  openDate,
  closeDate,
  openTime,
  closeTime,
  onCloseDatePicker,
  onCloseTimePicker,
  onConfirmOpenDate,
  onConfirmCloseDate,
  onConfirmOpenTime,
  onConfirmCloseTime,
}: Props) {
  return (
    <>
      <ContactDatePickerModal
        isOpen={datePickerTarget === "open"}
        title="Sales open date"
        value={openDate}
        onClose={onCloseDatePicker}
        onConfirm={onConfirmOpenDate}
        minSelectableIso={ADMIN_SALES_DATE_MIN_ISO}
        overlayZClass="z-[100]"
      />
      <ContactDatePickerModal
        isOpen={datePickerTarget === "close"}
        title="Sales close date"
        value={closeDate}
        onClose={onCloseDatePicker}
        onConfirm={onConfirmCloseDate}
        minSelectableIso={ADMIN_SALES_DATE_MIN_ISO}
        overlayZClass="z-[100]"
      />
      <ContactTimePickerModal
        isOpen={timePickerTarget === "open"}
        title="Sales open time"
        value={openTime}
        onClose={onCloseTimePicker}
        onConfirm={onConfirmOpenTime}
        overlayZClass="z-[100]"
      />
      <ContactTimePickerModal
        isOpen={timePickerTarget === "close"}
        title="Sales close time"
        value={closeTime}
        onClose={onCloseTimePicker}
        onConfirm={onConfirmCloseTime}
        overlayZClass="z-[100]"
      />
    </>
  );
}
