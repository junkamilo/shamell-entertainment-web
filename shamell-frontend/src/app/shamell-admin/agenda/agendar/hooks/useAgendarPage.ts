"use client";

import { type FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { hhmmToMinutes } from "@/lib/contactLogisticsUtils";
import { utcInstantForWallClock } from "@/lib/bookingAvailability";
import { toast } from "@/hooks/use-toast";
import { useAdminBookings } from "@/hooks/use-admin-bookings";
import { useIsMobile } from "@/hooks/use-mobile";
import { validateAgendarForm } from "../lib/agendarValidation";
import { AGENDA_HUB_PATH } from "../../lib/agendaRoutes";
import { buildAgendarBookingPayload } from "../lib/buildAgendarBookingPayload";
import { isBookingIdUuid } from "../lib/agendarQuery";
import { useAgendarAvailability } from "./useAgendarAvailability";
import { useAgendarCatalog } from "./useAgendarCatalog";
import { useAgendarFormState } from "./useAgendarFormState";
import { useAgendarEditPrefill } from "./useAgendarEditPrefill";
import { useAgendarOccupiedRanges } from "./useAgendarOccupiedRanges";
import { useAgendarQueryPrefill } from "./useAgendarQueryPrefill";

export function useAgendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useAgendarFormState();
  const { catalogLoading, catalog } = useAgendarCatalog();
  const availability = useAgendarAvailability(form.eventDateIso, { polling: false });
  const { occupiedRanges } = useAgendarOccupiedRanges(form.eventDateIso, {
    polling: false,
    refreshKey: `${form.eventDateIso}:${form.datePickerOpen}:${form.timePickerWhich ?? ""}`,
  });

  const bookingId = searchParams.get("bookingId")?.trim() ?? "";
  const isEditMode = isBookingIdUuid(bookingId);
  const { editLoading } = useAgendarEditPrefill(
    bookingId,
    isEditMode,
    searchParams,
    form,
    availability.bookingTz,
  );
  useAgendarQueryPrefill(searchParams, form, { enabled: !isEditMode });

  const { createBooking, patchBooking } = useAdminBookings(false);
  const isMobileLayout = useIsMobile();
  const [submitting, setSubmitting] = useState(false);

  const returnTo = searchParams.get("returnTo")?.trim() || AGENDA_HUB_PATH;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validated = validateAgendarForm({
      serviceIds: form.serviceIds,
      eventTypeId: form.eventTypeId,
      occasionTypeId: form.occasionTypeId,
      eventDateIso: form.eventDateIso,
      eventTimeStart: form.eventTimeStart,
      eventTimeEnd: form.eventTimeEnd,
      location: form.location,
      guestFullName: form.guestFullName,
      guestEmail: form.guestEmail,
      guestPhone: form.guestPhone,
      guestCount: form.guestCount,
      notes: form.notes,
    });
    if (validated.error || !validated.normalized) {
      toast({ title: validated.error ?? "Invalid form", variant: "destructive" });
      return;
    }
    const data = validated.normalized;

    const minuteOfDay = hhmmToMinutes(data.eventTimeStart);
    if (minuteOfDay === null) {
      toast({ title: "Invalid start time", variant: "destructive" });
      return;
    }
    const endM = hhmmToMinutes(data.eventTimeEnd);
    if (endM === null) {
      toast({ title: "Invalid end time", variant: "destructive" });
      return;
    }
    if (endM <= minuteOfDay) {
      toast({ title: "End time must be after start time", variant: "destructive" });
      return;
    }

    let parsed: Date;
    try {
      parsed = utcInstantForWallClock(data.eventDateIso, minuteOfDay, availability.bookingTz);
    } catch {
      toast({ title: "Invalid date or time", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const basePayload = buildAgendarBookingPayload(data, parsed.toISOString());
      if (isEditMode) {
        await patchBooking(bookingId, basePayload);
        toast({ title: "Booking updated" });
      } else {
        await createBooking({
          ...basePayload,
          ...(form.linkedContactRequestId
            ? {
                contactRequestId: form.linkedContactRequestId,
                source: "ADMIN_FROM_CONTACT" as const,
              }
            : {}),
        });
        toast({ title: "Booking created" });
      }
      form.clearNotesAndGuestCountAfterSubmit();
      if (returnTo.startsWith("/")) {
        const join = returnTo.includes("?") ? "&" : "?";
        router.push(`${returnTo}${join}updated=1`);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    form,
    catalog,
    catalogLoading,
    editLoading,
    availability,
    occupiedRanges,
    isMobileLayout,
    submitting,
    isEditMode,
    onSubmit,
  };
}
