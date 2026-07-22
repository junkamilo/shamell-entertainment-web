"use client";

import { useCallback, useMemo, useState } from "react";
import { hhmmToMinutes } from "@/lib/contactLogisticsUtils";
import { toast } from "@/hooks/use-toast";
import { utcInstantForWallClock } from "@/lib/bookingAvailability";
import { useMiAgendaBookings } from "./useMiAgendaBookings";
import { useMiAgendaCalendar } from "./useMiAgendaCalendar";
import { useMiAgendaEventEdit } from "./useMiAgendaEventEdit";

export function useMiAgendaPage() {
  const calendar = useMiAgendaCalendar();
  const bookings = useMiAgendaBookings(calendar.range, calendar.tz);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [savingCancel, setSavingCancel] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const selected = useMemo(
    () => bookings.items.find((x) => x.id === selectedId) ?? null,
    [bookings.items, selectedId],
  );

  const edit = useMiAgendaEventEdit(selected);

  const onSaveEdit = useCallback(async () => {
    if (!selected) return;
    const startM = hhmmToMinutes(edit.editStart);
    const endM = hhmmToMinutes(edit.editEnd);
    if (startM === null || endM === null || endM <= startM) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }
    edit.setSavingEdit(true);
    try {
      const eventDate = utcInstantForWallClock(edit.editDateIso, startM, calendar.tz).toISOString();
      const details =
        selected.bookingDetails && typeof selected.bookingDetails === "object"
          ? { ...(selected.bookingDetails as Record<string, unknown>) }
          : {};
      details.eventTimeStart = edit.editStart;
      details.eventTimeEnd = edit.editEnd;
      await bookings.patchBooking(selected.id, {
        eventDate,
        location: edit.editLocation.trim(),
        notes: edit.editNotes.trim(),
        bookingDetails: details,
      });
      edit.setIsEditing(false);
      toast({ title: "Booking updated" });
    } catch (err) {
      toast({
        title: "Could not update",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      edit.setSavingEdit(false);
    }
  }, [selected, edit, calendar.tz, bookings]);

  const onCancelBooking = useCallback(async () => {
    if (!selected) return;
    setSavingCancel(true);
    try {
      await bookings.patchBooking(selected.id, { status: "CANCELLED" });
      setSelectedId(null);
      edit.setIsEditing(false);
      toast({ title: "Booking canceled" });
    } catch (err) {
      toast({
        title: "Could not cancel",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingCancel(false);
    }
  }, [selected, bookings, edit]);

  const onConfirmCancel = useCallback(async () => {
    setCancelModalOpen(false);
    await onCancelBooking();
  }, [onCancelBooking]);

  return {
    calendar,
    bookings,
    selectedId,
    setSelectedId,
    selected,
    edit,
    savingCancel,
    cancelModalOpen,
    setCancelModalOpen,
    onSaveEdit,
    onConfirmCancel,
  };
}
