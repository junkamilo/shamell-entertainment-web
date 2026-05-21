"use client";

import { useEffect, useState } from "react";
import type { EnrichedBooking } from "../types/miAgenda.types";

export function useMiAgendaEventEdit(selected: EnrichedBooking | null) {
  const [isEditing, setIsEditing] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editDateIso, setEditDateIso] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (!selected) {
      setIsEditing(false);
      return;
    }
    const details =
      selected.bookingDetails && typeof selected.bookingDetails === "object"
        ? (selected.bookingDetails as Record<string, unknown>)
        : {};
    setEditDateIso(selected.dateIso);
    setEditStart(typeof details.eventTimeStart === "string" ? details.eventTimeStart : selected.start);
    setEditEnd(typeof details.eventTimeEnd === "string" ? details.eventTimeEnd : selected.end);
    setEditLocation(selected.location ?? "");
    setEditNotes(selected.notes ?? "");
  }, [selected]);

  const toggleEditing = () => setIsEditing((v) => !v);

  return {
    isEditing,
    setIsEditing,
    savingEdit,
    setSavingEdit,
    editDateIso,
    setEditDateIso,
    editStart,
    setEditStart,
    editEnd,
    setEditEnd,
    editLocation,
    setEditLocation,
    editNotes,
    setEditNotes,
    toggleEditing,
  };
}
