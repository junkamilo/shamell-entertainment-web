"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import {
  buildDaySectionOffers,
  sumSelectedOfferPrices,
} from "@/app/on-coming-events/lib/buildDaySectionOffers";
import {
  buildMonthPackagePreview,
  isMonthPackagePurchasable,
  listMonthSessions,
} from "@/app/on-coming-events/lib/buildMonthPackagePreview";
import { getNextOccurrence } from "@/app/on-coming-events/lib/buildScheduleMonthGrid";
import { toast } from "@/hooks/use-toast";
import { toISOLocalDate } from "@/lib/contactLogisticsUtils";
import {
  getBookClassSetupIssues,
  isBookableClassContext,
} from "../../book-class/lib/bookClassReadiness";
import {
  resolvePurchaseKind,
  validateBookClassForm,
} from "../../book-class/lib/bookClassValidation";
import type { BookClassEventContext } from "../../book-class/types/bookClass.types";
import { buildBoxOfficeClassesDetails } from "../lib/buildBoxOfficeClassesDetails";
import {
  createBoxOfficeClassCash,
  createBoxOfficeClassCheckout,
} from "../services/createBoxOfficeClassEnrollment";
import { fetchBoxOfficeClassContext } from "../services/fetchBoxOfficeClassContext";
import { fetchBoxOfficeClassEvents } from "../services/fetchBoxOfficeClassEvents";
import type {
  BoxOfficeClassBookingKind,
  BoxOfficeClassEventContext,
  BoxOfficeClassEventOption,
} from "../types/boxOfficeClasses.types";
import type { BoxOfficePaymentMethod } from "../types/boxOfficeFixed.types";

export function useBoxOfficeClassesForm() {
  const [events, setEvents] = useState<BoxOfficeClassEventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [eventId, setEventId] = useState("");
  const [context, setContext] = useState<BoxOfficeClassEventContext | null>(
    null,
  );
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);

  const [bookingKind, setBookingKind] =
    useState<BoxOfficeClassBookingKind>("day");
  const [weekday, setWeekday] = useState<number | null>(null);
  const [selectedDateIso, setSelectedDateIso] = useState<string | null>(null);
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [monthIso, setMonthIso] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<BoxOfficePaymentMethod>("cash");
  const [cashConfirmed, setCashConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAdminBearerToken();
    if (!token) {
      setEventsLoading(false);
      setEventsError("Not signed in.");
      return;
    }
    let cancelled = false;
    void (async () => {
      setEventsLoading(true);
      const result = await fetchBoxOfficeClassEvents(token);
      if (cancelled) return;
      setEventsLoading(false);
      if (!result.ok) {
        setEventsError(result.message ?? "Could not load class events.");
        setEvents([]);
        return;
      }
      setEventsError(null);
      setEvents(result.events);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!eventId) {
      setContext(null);
      setContextError(null);
      return;
    }
    const token = getAdminBearerToken();
    if (!token) return;
    let cancelled = false;
    void (async () => {
      setContextLoading(true);
      setContextError(null);
      const result = await fetchBoxOfficeClassContext(token, eventId);
      if (cancelled) return;
      setContextLoading(false);
      if (!result.ok || !result.context) {
        setContext(null);
        setContextError(result.message ?? "Could not load class event.");
        return;
      }
      setContext(result.context);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const schedule = context?.schedule ?? null;
  const days = schedule?.mode === "RECURRING_WEEKLY" ? schedule.days : [];
  const timezone =
    schedule?.mode === "RECURRING_WEEKLY"
      ? schedule.timezone
      : "America/New_York";
  const monthPackage = context?.monthPackage ?? null;
  const hasMonthPackage = isMonthPackagePurchasable(monthPackage);
  const bookClassContext = context as BookClassEventContext | null;
  const contextBookable = bookClassContext
    ? isBookableClassContext(bookClassContext)
    : false;
  const setupIssues = bookClassContext
    ? getBookClassSetupIssues(bookClassContext)
    : [];

  useEffect(() => {
    if (hasMonthPackage && monthPackage?.currentMonthIso) {
      setMonthIso(monthPackage.currentMonthIso);
    }
  }, [hasMonthPackage, monthPackage?.currentMonthIso]);

  const sectionOffers = useMemo(() => {
    if (!context || weekday == null || !selectedDateIso) return [];
    const day = days.find((d) => d.weekday === weekday);
    return buildDaySectionOffers({
      dateIso: selectedDateIso,
      weekday,
      sections: day?.sections ?? [],
      sessions: context.sessions,
      timezone,
    });
  }, [context, days, selectedDateIso, weekday, timezone]);

  const selectedTotal = useMemo(
    () => sumSelectedOfferPrices(sectionOffers, selectedSessionIds),
    [sectionOffers, selectedSessionIds],
  );

  const monthPreview = useMemo(() => {
    if (!context || !monthIso || !hasMonthPackage) return null;
    return buildMonthPackagePreview({
      monthIso,
      sessions: context.sessions,
      timezone,
      weekdayLabels:
        schedule?.mode === "RECURRING_WEEKLY" ? schedule.weekdayLabels : [],
    });
  }, [context, monthIso, hasMonthPackage, schedule, timezone]);

  const monthSessionIds = useMemo(() => {
    if (!context || !monthIso || !hasMonthPackage) return [];
    return listMonthSessions(context.sessions, monthIso, timezone).map(
      (s) => s.id,
    );
  }, [context, monthIso, hasMonthPackage, timezone]);

  const displayTotal =
    bookingKind === "month"
      ? (monthPackage?.price ?? null)
      : selectedTotal > 0
        ? selectedTotal
        : null;

  const onSelectEvent = useCallback((id: string) => {
    setEventId(id);
    setFormError(null);
    setCashConfirmed(false);
    setWeekday(null);
    setSelectedDateIso(null);
    setSelectedSessionIds(new Set());
    setMonthIso(null);
    setBookingKind("day");
  }, []);

  const onSelectWeekday = useCallback((nextWeekday: number) => {
    setWeekday(nextWeekday);
    const dateIso = getNextOccurrence(
      [nextWeekday],
      toISOLocalDate(new Date()),
    );
    setSelectedDateIso(dateIso);
    setSelectedSessionIds(new Set());
  }, []);

  const toggleSessionId = useCallback((sessionId: string) => {
    setSelectedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  }, []);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setFormError(null);

      if (context && !contextBookable) {
        setFormError(
          setupIssues[0] ?? "Complete the class schedule before booking.",
        );
        return;
      }

      const validationError = validateBookClassForm(
        {
          eventId,
          bookingKind,
          weekday,
          selectedDateIso,
          selectedSessionIds,
          monthIso,
          customerName,
          customerEmail,
          customerPhone,
          paymentMethod,
          cashConfirmed,
        },
        hasMonthPackage,
      );
      if (validationError) {
        setFormError(validationError);
        return;
      }

      const token = getAdminBearerToken();
      if (!token) {
        setFormError("Not signed in.");
        return;
      }

      const purchaseKind = resolvePurchaseKind({
        eventId,
        bookingKind,
        weekday,
        selectedDateIso,
        selectedSessionIds,
        monthIso,
        customerName,
        customerEmail,
        customerPhone,
        paymentMethod,
        cashConfirmed,
      });

      const sessionIds = [...selectedSessionIds];
      const boxOfficeDetails = buildBoxOfficeClassesDetails({
        purchaseKind,
        upcomingEventId: eventId,
        paymentMethod,
        customerName,
        customerEmail,
        customerPhone,
        selectedDateIso,
        weekday,
        sessionIds,
        sectionOffers,
        monthIso,
        monthPackageLabel: monthPackage?.label?.trim() || "Full month package",
        monthPackagePrice: monthPackage?.price ?? null,
        monthSessionCount: monthPreview?.sessionCount ?? null,
        monthSessionIds,
      });

      const body = {
        purchaseKind,
        upcomingEventId: eventId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim() || undefined,
        boxOfficeDetails,
        ...(purchaseKind === "session"
          ? { sessionId: sessionIds[0] }
          : purchaseKind === "day_bundle"
            ? { sessionIds }
            : { monthIso: monthIso! }),
      };

      setSubmitting(true);
      const result =
        paymentMethod === "cash"
          ? await createBoxOfficeClassCash(token, body)
          : await createBoxOfficeClassCheckout(token, body);
      setSubmitting(false);

      if (!result.ok) {
        setFormError(result.message);
        return;
      }

      toast({
        title:
          paymentMethod === "cash" ? "Class reserved" : "Payment link sent",
        description:
          paymentMethod === "cash"
            ? result.message
            : `A secure payment email was sent to ${customerEmail.trim()}.`,
      });
      setSelectedSessionIds(new Set());
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setCashConfirmed(false);

      if (eventId) {
        const refreshed = await fetchBoxOfficeClassContext(token, eventId);
        if (refreshed.ok && refreshed.context) {
          setContext(refreshed.context);
        }
      }
    },
    [
      bookingKind,
      cashConfirmed,
      context,
      contextBookable,
      customerEmail,
      customerName,
      customerPhone,
      eventId,
      hasMonthPackage,
      monthIso,
      monthPackage?.label,
      monthPackage?.price,
      monthPreview?.sessionCount,
      monthSessionIds,
      paymentMethod,
      sectionOffers,
      selectedDateIso,
      selectedSessionIds,
      setupIssues,
      weekday,
    ],
  );

  return {
    events,
    eventsLoading,
    eventsError,
    eventId,
    onSelectEvent,
    context,
    contextLoading,
    contextError,
    bookingKind,
    setBookingKind,
    weekday,
    selectedDateIso,
    selectedSessionIds,
    toggleSessionId,
    monthIso,
    setMonthIso,
    days,
    monthPackage,
    hasMonthPackage,
    contextBookable,
    setupIssues,
    sectionOffers,
    monthPreview,
    displayTotal,
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
    submitting,
    formError,
    onSelectWeekday,
    onSubmit,
  };
}
