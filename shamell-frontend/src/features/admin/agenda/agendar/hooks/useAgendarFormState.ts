"use client";

import { useMemo, useState } from "react";
import { getAgendarMobileSectionStatus } from "../lib/agendarValidation";
import type { AgendarMobileSectionId } from "../types/agendar.types";

export function useAgendarFormState() {
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [eventTypeId, setEventTypeId] = useState("");
  const [occasionTypeId, setOccasionTypeId] = useState("");
  const [eventDateIso, setEventDateIso] = useState("");
  const [eventTimeStart, setEventTimeStart] = useState("");
  const [eventTimeEnd, setEventTimeEnd] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerWhich, setTimePickerWhich] = useState<null | "start" | "end">(null);
  const [location, setLocation] = useState("");
  const [guestFullName, setGuestFullName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [notes, setNotes] = useState("");
  const [linkedContactRequestId, setLinkedContactRequestId] = useState("");
  const [mobileSectionModal, setMobileSectionModal] = useState<AgendarMobileSectionId | null>(null);

  const mobileSectionStatus = useMemo(
    () =>
      getAgendarMobileSectionStatus({
        serviceIds,
        eventTypeId,
        occasionTypeId,
        eventDateIso,
        eventTimeStart,
        eventTimeEnd,
        location,
        guestFullName,
        guestEmail,
        guestPhone,
        guestCount,
        notes,
      }),
    [
      serviceIds,
      eventTypeId,
      occasionTypeId,
      eventDateIso,
      eventTimeStart,
      eventTimeEnd,
      location,
      guestFullName,
      guestEmail,
      guestPhone,
      guestCount,
      notes,
    ],
  );

  const clearNotesAndGuestCountAfterSubmit = () => {
    setNotes("");
    setGuestCount("");
  };

  return {
    serviceIds,
    setServiceIds,
    eventTypeId,
    setEventTypeId,
    occasionTypeId,
    setOccasionTypeId,
    eventDateIso,
    setEventDateIso,
    eventTimeStart,
    setEventTimeStart,
    eventTimeEnd,
    setEventTimeEnd,
    datePickerOpen,
    setDatePickerOpen,
    timePickerWhich,
    setTimePickerWhich,
    location,
    setLocation,
    guestFullName,
    setGuestFullName,
    guestEmail,
    setGuestEmail,
    guestPhone,
    setGuestPhone,
    guestCount,
    setGuestCount,
    notes,
    setNotes,
    linkedContactRequestId,
    setLinkedContactRequestId,
    mobileSectionModal,
    setMobileSectionModal,
    mobileSectionStatus,
    clearNotesAndGuestCountAfterSubmit,
  };
}
