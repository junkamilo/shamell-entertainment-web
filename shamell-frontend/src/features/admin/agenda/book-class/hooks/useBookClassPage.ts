"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { getAdminBearerToken } from "@/app/admin/shared/lib/adminAuth";
import { toast } from "@/hooks/use-toast";
import { toISOLocalDate } from "@/lib/contactLogisticsUtils";
import {
  buildDaySectionOffers,
  sumSelectedOfferPrices,
} from "@/features/on-coming-events/lib/buildDaySectionOffers";
import {
  buildMonthPackagePreview,
  isMonthPackagePurchasable,
} from "@/features/on-coming-events/lib/buildMonthPackagePreview";
import { getNextOccurrence } from "@/features/on-coming-events/lib/buildScheduleMonthGrid";
import {
  createAdminClassCashEnrollment,
  createAdminClassCheckoutSession,
} from "../services/createAdminClassEnrollment";
import {
  resolvePurchaseKind,
  validateBookClassForm,
} from "../lib/bookClassValidation";
import {
  getBookClassSetupIssues,
  isBookableClassContext,
} from "../lib/bookClassReadiness";
import { useBookClassCatalog } from "./useBookClassCatalog";
import { useBookClassFormState } from "./useBookClassFormState";

export function useBookClassPage() {
  const form = useBookClassFormState();
  const catalog = useBookClassCatalog(form.eventId);
  const [submitting, setSubmitting] = useState(false);

  const schedule = catalog.context?.schedule ?? null;
  const days = schedule?.mode === "RECURRING_WEEKLY" ? schedule.days : [];
  const timezone =
    schedule?.mode === "RECURRING_WEEKLY" ? schedule.timezone : "America/New_York";
  const monthPackage = catalog.context?.monthPackage ?? null;
  const hasMonthPackage = isMonthPackagePurchasable(monthPackage);
  const contextBookable = catalog.context
    ? isBookableClassContext(catalog.context)
    : false;
  const setupIssues = catalog.context
    ? getBookClassSetupIssues(catalog.context)
    : [];

  const sectionOffers = useMemo(() => {
    if (!catalog.context || form.weekday == null || !form.selectedDateIso) return [];
    const day = days.find((d) => d.weekday === form.weekday);
    return buildDaySectionOffers({
      dateIso: form.selectedDateIso,
      weekday: form.weekday,
      sections: day?.sections ?? [],
      sessions: catalog.context.sessions,
      timezone,
    });
  }, [catalog.context, days, form.selectedDateIso, form.weekday, timezone]);

  const selectedTotal = useMemo(
    () => sumSelectedOfferPrices(sectionOffers, form.selectedSessionIds),
    [sectionOffers, form.selectedSessionIds],
  );

  const monthPreview = useMemo(() => {
    if (!catalog.context || !form.monthIso || !hasMonthPackage) return null;
    return buildMonthPackagePreview({
      monthIso: form.monthIso,
      sessions: catalog.context.sessions,
      timezone,
      weekdayLabels:
        schedule?.mode === "RECURRING_WEEKLY" ? schedule.weekdayLabels : [],
    });
  }, [catalog.context, form.monthIso, hasMonthPackage, schedule, timezone]);

  useEffect(() => {
    if (hasMonthPackage && monthPackage?.currentMonthIso) {
      form.setMonthIso(monthPackage.currentMonthIso);
    }
  }, [hasMonthPackage, monthPackage?.currentMonthIso, form.setMonthIso]);

  const displayTotal =
    form.bookingKind === "month"
      ? monthPackage?.price ?? null
      : selectedTotal > 0
        ? selectedTotal
        : null;

  const onSelectWeekday = (nextWeekday: number) => {
    form.setWeekday(nextWeekday);
    const dateIso = getNextOccurrence([nextWeekday], toISOLocalDate(new Date()));
    form.setSelectedDateIso(dateIso);
    form.setSelectedSessionIds(new Set());
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (catalog.context && !contextBookable) {
      toast({
        title: "Class event not ready",
        description: setupIssues[0] ?? "Complete the class schedule before booking.",
        variant: "destructive",
      });
      return;
    }
    const validationError = validateBookClassForm(
      {
        eventId: form.eventId,
        bookingKind: form.bookingKind,
        weekday: form.weekday,
        selectedDateIso: form.selectedDateIso,
        selectedSessionIds: form.selectedSessionIds,
        monthIso: form.monthIso,
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        paymentMethod: form.paymentMethod,
        cashConfirmed: form.cashConfirmed,
      },
      hasMonthPackage,
    );
    if (validationError) {
      toast({ title: "Check the form", description: validationError, variant: "destructive" });
      return;
    }

    const token = getAdminBearerToken();
    if (!token) {
      toast({ title: "Not signed in", variant: "destructive" });
      return;
    }

    const purchaseKind = resolvePurchaseKind({
      eventId: form.eventId,
      bookingKind: form.bookingKind,
      weekday: form.weekday,
      selectedDateIso: form.selectedDateIso,
      selectedSessionIds: form.selectedSessionIds,
      monthIso: form.monthIso,
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      customerPhone: form.customerPhone,
      paymentMethod: form.paymentMethod,
      cashConfirmed: form.cashConfirmed,
    });

    const body = {
      purchaseKind,
      upcomingEventId: form.eventId,
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim(),
      customerPhone: form.customerPhone.trim() || undefined,
      ...(purchaseKind === "session"
        ? { sessionId: [...form.selectedSessionIds][0] }
        : purchaseKind === "day_bundle"
          ? { sessionIds: [...form.selectedSessionIds] }
          : { monthIso: form.monthIso! }),
    };

    setSubmitting(true);
    const result =
      form.paymentMethod === "cash"
        ? await createAdminClassCashEnrollment(token, body)
        : await createAdminClassCheckoutSession(token, body);
    setSubmitting(false);

    if (!result.ok) {
      toast({ title: "Could not book class", description: result.message, variant: "destructive" });
      return;
    }

    toast({
      title: form.paymentMethod === "cash" ? "Class reserved" : "Payment link sent",
      description:
        form.paymentMethod === "cash"
          ? result.message
          : `A secure payment email was sent to ${form.customerEmail.trim()}.`,
    });
    form.resetAfterSubmit();
  };

  return {
    form,
    catalog,
    days,
    timezone,
    monthPackage,
    hasMonthPackage,
    contextBookable,
    setupIssues,
    sectionOffers,
    monthPreview,
    displayTotal,
    submitting,
    onSelectWeekday,
    onSubmit,
  };
}
