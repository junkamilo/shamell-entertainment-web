"use client";

import { useState } from "react";
import type { ClosureDatePickerTarget, ClosureKind } from "../types/disponibilidad.types";

export function useClosureFormState() {
  const [closureKind, setClosureKind] = useState<ClosureKind>("SPECIFIC_DATE");
  const [closureDate, setClosureDate] = useState("");
  const [closureStartDate, setClosureStartDate] = useState("");
  const [closureEndDate, setClosureEndDate] = useState("");
  const [closureWeekday, setClosureWeekday] = useState(0);
  const [closureNote, setClosureNote] = useState("");
  const [addingClosure, setAddingClosure] = useState(false);
  const [confirmClosureId, setConfirmClosureId] = useState<string | null>(null);
  const [closureDatePickerTarget, setClosureDatePickerTarget] =
    useState<ClosureDatePickerTarget | null>(null);

  const resetClosureFields = () => {
    setClosureDate("");
    setClosureStartDate("");
    setClosureEndDate("");
    setClosureNote("");
  };

  const onClosureKindChange = (id: string) => {
    setClosureKind(id as ClosureKind);
    setClosureDatePickerTarget(null);
  };

  const onClosureDateConfirm = (iso: string) => {
    if (closureDatePickerTarget === "start") setClosureStartDate(iso);
    else if (closureDatePickerTarget === "end") setClosureEndDate(iso);
    else setClosureDate(iso);
  };

  return {
    closureKind,
    setClosureKind,
    closureDate,
    setClosureDate,
    closureStartDate,
    setClosureStartDate,
    closureEndDate,
    setClosureEndDate,
    closureWeekday,
    setClosureWeekday,
    closureNote,
    setClosureNote,
    addingClosure,
    setAddingClosure,
    confirmClosureId,
    setConfirmClosureId,
    closureDatePickerTarget,
    setClosureDatePickerTarget,
    resetClosureFields,
    onClosureKindChange,
    onClosureDateConfirm,
  };
}
