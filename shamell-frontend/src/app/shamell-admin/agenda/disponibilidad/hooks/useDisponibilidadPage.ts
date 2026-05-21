"use client";

import { type FormEvent, useCallback, useMemo, useState } from "react";
import { toast } from "@/hooks/use-toast";
import type { ActivePanel, TimePickerTarget } from "../types/disponibilidad.types";
import { useClosureFormState } from "./useClosureFormState";
import { useDisponibilidadAvailability } from "./useDisponibilidadAvailability";
import { useWeeklyHoursDraft } from "./useWeeklyHoursDraft";

export function useDisponibilidadPage() {
  const availability = useDisponibilidadAvailability();
  const weekly = useWeeklyHoursDraft(availability.snapshot);
  const closure = useClosureFormState();

  const [activePanel, setActivePanel] = useState<ActivePanel>("weekly");
  const [timePickerTarget, setTimePickerTarget] = useState<TimePickerTarget | null>(null);

  const pickerValue = useMemo(() => {
    if (!timePickerTarget) return "";
    const row = weekly.weeklyDraft.find((w) => w.weekday === timePickerTarget.weekday);
    if (!row) return "";
    return timePickerTarget.field === "start" ? row.startTime ?? "" : row.endTime ?? "";
  }, [timePickerTarget, weekly.weeklyDraft]);

  const onSaveWeekly = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      weekly.setSavingWeekly(true);
      try {
        await availability.putWeekly(weekly.weeklyDraft);
        toast({ title: "Hours saved" });
      } catch (err) {
        toast({
          title: "Could not save",
          description: err instanceof Error ? err.message : "",
          variant: "destructive",
        });
      } finally {
        weekly.setSavingWeekly(false);
      }
    },
    [availability, weekly],
  );

  const onAddClosure = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      closure.setAddingClosure(true);
      try {
        if (closure.closureKind === "SPECIFIC_DATE") {
          if (!closure.closureDate) throw new Error("Pick a date for this one-day closure.");
          await availability.createClosure({
            kind: "SPECIFIC_DATE",
            date: closure.closureDate,
            note: closure.closureNote || undefined,
          });
        } else if (closure.closureKind === "DATE_RANGE") {
          if (!closure.closureStartDate || !closure.closureEndDate) {
            throw new Error("Pick start and end dates.");
          }
          await availability.createClosure({
            kind: "DATE_RANGE",
            startDate: closure.closureStartDate,
            endDate: closure.closureEndDate,
            note: closure.closureNote || undefined,
          });
        } else {
          await availability.createClosure({
            kind: "RECURRING_WEEKDAY",
            weekday: closure.closureWeekday,
            note: closure.closureNote || undefined,
          });
        }
        closure.resetClosureFields();
        toast({ title: "Closure added" });
      } catch (err) {
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "",
          variant: "destructive",
        });
      } finally {
        closure.setAddingClosure(false);
      }
    },
    [availability, closure],
  );

  const onConfirmDeleteClosure = useCallback(() => {
    if (!closure.confirmClosureId) return;
    const id = closure.confirmClosureId;
    closure.setConfirmClosureId(null);
    availability.removeClosure(id).catch((err: unknown) =>
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      }),
    );
  }, [availability, closure]);

  const onTimePickerConfirm = useCallback(
    (hhmm: string) => {
      if (!timePickerTarget) return;
      weekly.setRowTime(timePickerTarget.weekday, timePickerTarget.field, hhmm);
    },
    [timePickerTarget, weekly],
  );

  return {
    snapshot: availability.snapshot,
    isLoading: availability.isLoading,
    error: availability.error,
    reload: availability.reload,
    activePanel,
    setActivePanel,
    timePickerTarget,
    setTimePickerTarget,
    pickerValue,
    onSaveWeekly,
    onAddClosure,
    onConfirmDeleteClosure,
    onTimePickerConfirm,
    weekly,
    closure,
  };
}
