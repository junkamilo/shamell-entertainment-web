"use client";

import { useCallback, useState } from "react";
import type { BookClassBookingKind, BookClassPaymentMethod } from "../types/bookClass.types";

export function useBookClassFormState() {
  const [eventId, setEventId] = useState("");
  const [bookingKind, setBookingKind] = useState<BookClassBookingKind>("day");
  const [weekday, setWeekday] = useState<number | null>(null);
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [monthIso, setMonthIso] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<BookClassPaymentMethod>("stripe");
  const [cashConfirmed, setCashConfirmed] = useState(false);

  const toggleSessionId = useCallback((sessionId: string) => {
    setSelectedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  }, []);

  const resetAfterSubmit = useCallback(() => {
    setSelectedSessionIds(new Set());
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCashConfirmed(false);
  }, []);

  const resetForEventChange = useCallback(() => {
    setWeekday(null);
    setSelectedDateIso(null);
    setSelectedSessionIds(new Set());
    setMonthIso(null);
    setBookingKind("day");
  }, []);

  return {
    eventId,
    setEventId,
    bookingKind,
    setBookingKind,
    weekday,
    setWeekday,
    selectedDateIso,
    setSelectedDateIso,
    selectedSessionIds,
    setSelectedSessionIds,
    toggleSessionId,
    monthIso,
    setMonthIso,
    customerName,
    setCustomerName,
    customerEmail,
    setCustomerEmail,
    customerPhone,
    setCustomerPhone,
    paymentMethod,
    setPaymentMethod,
    cashConfirmed,
    setCashConfirmed,
    resetAfterSubmit,
    resetForEventChange,
  };
}

export type BookClassFormState = ReturnType<typeof useBookClassFormState>;
