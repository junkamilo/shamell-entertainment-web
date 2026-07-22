import ContactDatePickerModal from "@/app/contacto/components/ContactDatePickerModal";
import ContactTimePickerModal from "@/app/contacto/components/ContactTimePickerModal";
import type { ClosureDatePickerTarget, TimePickerTarget } from "../types/disponibilidad.types";

type Props = {
  timePickerTarget: TimePickerTarget | null;
  pickerValue: string;
  onCloseTimePicker: () => void;
  onTimePickerConfirm: (hhmm: string) => void;
  closureDatePickerTarget: ClosureDatePickerTarget | null;
  closureDate: string;
  closureStartDate: string;
  closureEndDate: string;
  onCloseDatePicker: () => void;
  onClosureDateConfirm: (iso: string) => void;
};

export default function DisponibilidadPickers({
  timePickerTarget,
  pickerValue,
  onCloseTimePicker,
  onTimePickerConfirm,
  closureDatePickerTarget,
  closureDate,
  closureStartDate,
  closureEndDate,
  onCloseDatePicker,
  onClosureDateConfirm,
}: Props) {
  const datePickerValue =
    closureDatePickerTarget === "start"
      ? closureStartDate
      : closureDatePickerTarget === "end"
        ? closureEndDate
        : closureDate;

  const datePickerTitle =
    closureDatePickerTarget === "start"
      ? "Start date"
      : closureDatePickerTarget === "end"
        ? "End date"
        : "Closure date";

  return (
    <>
      <ContactTimePickerModal
        isOpen={Boolean(timePickerTarget)}
        title={timePickerTarget?.field === "end" ? "End time" : "Start time"}
        value={pickerValue}
        onClose={onCloseTimePicker}
        onConfirm={onTimePickerConfirm}
      />
      <ContactDatePickerModal
        isOpen={closureDatePickerTarget !== null}
        title={datePickerTitle}
        value={datePickerValue}
        onClose={onCloseDatePicker}
        onConfirm={onClosureDateConfirm}
      />
    </>
  );
}
