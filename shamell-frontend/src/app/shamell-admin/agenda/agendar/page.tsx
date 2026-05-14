"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import AdminAccordionSingleSelect from "@/components/admin/AdminAccordionSingleSelect";
import AdminBackButton from "@/components/admin/AdminBackButton";
import AdminModal from "@/components/admin/AdminModal";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminServicesMultiSelect from "@/components/admin/AdminServicesMultiSelect";
import ContactDatePickerModal from "@/components/contact/ContactDatePickerModal";
import ContactTimePickerModal from "@/components/contact/ContactTimePickerModal";
import {
  formatDateDisplayUs,
  formatTimeDisplayUs,
  hhmmToMinutes,
} from "@/components/contact/contactLogisticsUtils";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import {
  expandBlockedDateReasonsMap,
  expandBlockedDates,
  isoDateInTzNow,
  timeBoundsForDateISO,
  utcInstantForWallClock,
} from "@/lib/bookingAvailability";
import { toast } from "@/hooks/use-toast";
import { usePublicAvailability } from "@/hooks/use-public-availability";
import { useAdminBookings } from "@/hooks/use-admin-bookings";
import { useAdminContactRequests } from "@/hooks/use-admin-contact-requests";
import {
  sanitizeIntegerInput,
  sanitizeNameInput,
  sanitizePhoneInput,
  validateAgendarForm,
  getAgendarMobileSectionStatus,
} from "@/app/shamell-admin/agenda/agendar/form-validation";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type IdName = { id: string; name: string };

const logisticsPickerTriggerClass =
  "shamell-glass-trigger flex min-h-[52px] w-full min-w-0 items-center justify-between gap-3 rounded-xl px-4 py-3 text-left text-base text-foreground outline-none";

const fieldLabelClass =
  "font-brand text-xs tracking-[0.2em] text-gold";

function AgendaAgendarPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiBaseUrl = useMemo(
    () => (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, ""),
    [],
  );

  const { createBooking, patchBooking } = useAdminBookings(false);
  const { setStatus: setContactRequestStatus } = useAdminContactRequests(false);

  const [catalogLoading, setCatalogLoading] = useState(true);
  const [services, setServices] = useState<{ id: string; serviceTypeName: string }[]>([]);
  const [eventTypes, setEventTypes] = useState<IdName[]>([]);
  const [occasions, setOccasions] = useState<IdName[]>([]);

  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [eventTypeId, setEventTypeId] = useState("");
  const [occasionTypeId, setOccasionTypeId] = useState("");
  const [eventDateIso, setEventDateIso] = useState("");
  const [eventTimeStart, setEventTimeStart] = useState("");
  const [eventTimeEnd, setEventTimeEnd] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timePickerWhich, setTimePickerWhich] = useState<null | "start" | "end">(null);
  const [occupiedRanges, setOccupiedRanges] = useState<Array<{ startMinutes: number; endMinutes: number }>>([]);
  const [location, setLocation] = useState("");
  const [guestFullName, setGuestFullName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [notes, setNotes] = useState("");
  const [linkedContactRequestId, setLinkedContactRequestId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mobileSectionModal, setMobileSectionModal] = useState<
    null | "event" | "logistics" | "client"
  >(null);
  const bookingId = searchParams.get("bookingId")?.trim() ?? "";
  const returnTo = searchParams.get("returnTo")?.trim() || "/shamell-admin/agenda";
  const isEditMode = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(bookingId);

  const isMobileLayout = useIsMobile();

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

  const { rules: availabilityRules } = usePublicAvailability(true);
  const bookingTz = useMemo(
    () => availabilityRules?.timeZone ?? process.env.NEXT_PUBLIC_BOOKING_TZ ?? "America/New_York",
    [availabilityRules?.timeZone],
  );
  const blockedIsoDates = useMemo(() => {
    if (!availabilityRules?.weekly) return new Set<string>();
    return expandBlockedDates(bookingTz, availabilityRules.weekly, availabilityRules.closures, 420);
  }, [availabilityRules, bookingTz]);

  const blockedReasonByIso = useMemo(() => {
    if (!availabilityRules?.weekly) return new Map<string, string>();
    return expandBlockedDateReasonsMap(bookingTz, availabilityRules.weekly, availabilityRules.closures, 420);
  }, [availabilityRules, bookingTz]);

  const startTimeClamp = useMemo(() => {
    if (!availabilityRules?.weekly || !eventDateIso) return undefined;
    return timeBoundsForDateISO(eventDateIso, bookingTz, availabilityRules.weekly);
  }, [availabilityRules, eventDateIso, bookingTz]);

  const minSelectableIso = availabilityRules ? isoDateInTzNow(bookingTz) : undefined;

  const authHeaders = useCallback((): HeadersInit => {
    const token = typeof window !== "undefined" ? localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) : null;
    const h: HeadersInit = {};
    if (token) (h as Record<string, string>).Authorization = `Bearer ${token}`;
    return h;
  }, []);

  useEffect(() => {
    const qName = searchParams.get("fullName") ?? "";
    const qEmail = searchParams.get("email") ?? "";
    const qPhone = searchParams.get("phone") ?? "";
    const qDate = searchParams.get("eventDate") ?? "";
    const qLocation = searchParams.get("location") ?? "";
    const qStart = searchParams.get("start") ?? "";
    const qEnd = searchParams.get("end") ?? "";
    const qMessage = searchParams.get("message") ?? "";
    const qServiceIds = searchParams.get("serviceIds") ?? "";
    const qServiceId = searchParams.get("serviceId") ?? "";
    const qEventTypeId = searchParams.get("eventTypeId") ?? "";
    const qOccasionTypeId = searchParams.get("occasionTypeId") ?? "";
    const qGuestCount = searchParams.get("guestCount") ?? "";
    const qContactId = searchParams.get("contactId")?.trim() ?? "";

    const uuidOk = (s: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s.trim());

    if (qName) setGuestFullName(sanitizeNameInput(qName));
    if (qEmail) setGuestEmail(qEmail.trim().toLowerCase());
    if (qPhone) setGuestPhone(sanitizePhoneInput(qPhone));
    if (/^\d{4}-\d{2}-\d{2}$/.test(qDate)) setEventDateIso(qDate);
    if (qLocation) setLocation(qLocation.trim());
    if (/^\d{2}:\d{2}$/.test(qStart)) setEventTimeStart(qStart);
    if (/^\d{2}:\d{2}$/.test(qEnd)) setEventTimeEnd(qEnd);
    if (qMessage) setNotes(qMessage.trim());
    if (qServiceIds.trim()) {
      const parts = qServiceIds
        .split(",")
        .map((s) => s.trim())
        .filter((s) => uuidOk(s));
      if (parts.length > 0) setServiceIds(parts);
    } else if (uuidOk(qServiceId)) setServiceIds([qServiceId.trim()]);
    if (uuidOk(qEventTypeId)) setEventTypeId(qEventTypeId.trim());
    if (uuidOk(qOccasionTypeId)) setOccasionTypeId(qOccasionTypeId.trim());
    if (/^\d+$/.test(qGuestCount.trim())) setGuestCount(sanitizeIntegerInput(qGuestCount.trim()));
    if (uuidOk(qContactId)) setLinkedContactRequestId(qContactId.trim());
    else setLinkedContactRequestId("");
  }, [searchParams]);

  useEffect(() => {
    if (!eventDateIso) {
      setOccupiedRanges([]);
      return;
    }
    let cancelled = false;
    const loadOccupied = () => {
      fetch(`${apiBaseUrl}/api/v1/bookings/public/occupied?date=${encodeURIComponent(eventDateIso)}`, {
        cache: "no-store",
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("occupied");
          return res.json();
        })
        .then((json: unknown) => {
          if (cancelled || !json || typeof json !== "object") return;
          const occupied = (json as { occupied?: unknown }).occupied;
          if (!Array.isArray(occupied)) {
            setOccupiedRanges([]);
            return;
          }
          const parsed = occupied
            .map((row) => {
              const o = row as { startMinutes?: unknown; endMinutes?: unknown };
              const startMinutes = Number(o.startMinutes);
              const endMinutes = Number(o.endMinutes);
              if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) return null;
              return { startMinutes, endMinutes };
            })
            .filter(Boolean) as Array<{ startMinutes: number; endMinutes: number }>;
          setOccupiedRanges(parsed);
        })
        .catch(() => {
          if (!cancelled) setOccupiedRanges([]);
        });
    };

    loadOccupied();
    const interval = window.setInterval(loadOccupied, 45000);
    const onFocus = () => loadOccupied();
    const onVisible = () => {
      if (document.visibilityState === "visible") loadOccupied();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [apiBaseUrl, eventDateIso]);

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (!token) {
      setCatalogLoading(false);
      return;
    }
    setCatalogLoading(true);
    Promise.all([
      fetch(`${apiBaseUrl}/api/v1/services/admin`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${apiBaseUrl}/api/v1/events/types/admin`, { headers: authHeaders() }).then((r) => r.json()),
      fetch(`${apiBaseUrl}/api/v1/events/occasions/admin`, { headers: authHeaders() }).then((r) => r.json()),
    ])
      .then(([svcJson, typesJson, occJson]) => {
        if (cancelled) return;
        const svcList = Array.isArray(svcJson)
          ? svcJson.map((x: Record<string, unknown>) => ({
              id: String(x.id ?? ""),
              serviceTypeName: String(x.serviceTypeName ?? x.description ?? "Service"),
            }))
          : [];
        setServices(svcList.filter((s: { id: string }) => s.id));
        setEventTypes(
          Array.isArray(typesJson)
            ? typesJson
                .map((x: Record<string, unknown>) => ({
                  id: String(x.id ?? ""),
                  name: String(x.name ?? ""),
                }))
                .filter((x: IdName) => x.id)
            : [],
        );
        setOccasions(
          Array.isArray(occJson)
            ? occJson
                .map((x: Record<string, unknown>) => ({
                  id: String(x.id ?? ""),
                  name: String(x.name ?? ""),
                }))
                .filter((x: IdName) => x.id)
            : [],
        );
      })
      .catch(() => {
        if (!cancelled) toast({ title: "Could not load catalog", variant: "destructive" });
      })
      .finally(() => {
        if (!cancelled) setCatalogLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl, authHeaders]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validated = validateAgendarForm({
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
      parsed = utcInstantForWallClock(data.eventDateIso, minuteOfDay, bookingTz);
    } catch {
      toast({ title: "Invalid date or time", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const basePayload = {
        serviceId: data.serviceId,
        eventDate: parsed.toISOString(),
        location: data.location,
        eventTypeId: data.eventTypeId,
        occasionTypeId: data.occasionTypeId,
        guestFullName: data.guestFullName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        guestCount: data.guestCount,
        notes: data.notes || undefined,
        status: "CONFIRMED" as const,
        bookingDetails: {
          eventTimeStart: data.eventTimeStart,
          eventTimeEnd: data.eventTimeEnd,
          serviceIds: data.serviceIds,
        },
      };
      if (isEditMode) {
        await patchBooking(bookingId, basePayload);
        toast({ title: "Booking updated" });
      } else {
        await createBooking({
          ...basePayload,
          ...(linkedContactRequestId
            ? {
                contactRequestId: linkedContactRequestId,
                source: "ADMIN_FROM_CONTACT" as const,
              }
            : {}),
        });
        let extraDescription = "";
        if (linkedContactRequestId) {
          try {
            await setContactRequestStatus(linkedContactRequestId, "RESERVED");
          } catch {
            extraDescription =
              "The contact request could not be marked as reserved automatically; update it from Inbox if needed.";
          }
        }
        toast({
          title: "Booking created",
          ...(extraDescription ? { description: extraDescription } : {}),
        });
      }
      setNotes("");
      setGuestCount("");
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

  const eventSelects = (
    <>
      <div className="block">
        <span className={fieldLabelClass}>EVENT TYPE</span>
        <div className="mt-2">
          <AdminAccordionSingleSelect
            options={eventTypes.map((t) => ({ id: t.id, label: t.name }))}
            value={eventTypeId}
            onChange={setEventTypeId}
            emptyDisplay="Select an event type"
            ariaLabel="Select event type"
            required
            showNoneOption={false}
          />
        </div>
      </div>

      <div className="block">
        <span className={fieldLabelClass}>OCCASION</span>
        <div className="mt-2">
          <AdminAccordionSingleSelect
            options={occasions.map((o) => ({ id: o.id, label: o.name }))}
            value={occasionTypeId}
            onChange={setOccasionTypeId}
            emptyDisplay="Select an occasion"
            ariaLabel="Select occasion"
            required
            showNoneOption={false}
          />
        </div>
      </div>

      <div className="block">
        <span className={fieldLabelClass}>SERVICES</span>
        <p className="mt-1 font-body text-xs text-foreground/55">
          Choose one or more. Order is saved; the first is the primary catalog line.
        </p>
        <div className="mt-2">
          <AdminServicesMultiSelect
            options={services.map((s) => ({
              id: s.id,
              label: s.serviceTypeName,
            }))}
            value={serviceIds}
            onChange={setServiceIds}
          />
        </div>
      </div>
    </>
  );

  const dateAndTimeDesktop = (
    <div className="block">
      <span className={`${fieldLabelClass} block text-center`}>EVENT DATE & TIME</span>
      <div className="mx-auto mt-2 grid w-full max-w-5xl grid-cols-1 gap-4 sm:mt-3 sm:grid-cols-3 sm:gap-5 md:gap-8">
        <div className="flex min-w-0 flex-col gap-1">
          <span className={`${fieldLabelClass} block text-center sm:text-left`}>DATE</span>
          <button
            type="button"
            onClick={() => setDatePickerOpen(true)}
            className={logisticsPickerTriggerClass}
          >
            <span className="font-body text-foreground">
              {eventDateIso ? formatDateDisplayUs(eventDateIso) : "Choose date"}
            </span>
            <span className="shrink-0 font-brand text-xs tracking-[0.14em] text-gold">CALENDAR</span>
          </button>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className={`${fieldLabelClass} block text-center sm:text-left`}>START TIME</span>
          <button
            type="button"
            onClick={() => setTimePickerWhich("start")}
            className={logisticsPickerTriggerClass}
          >
            <span className="font-body text-foreground">
              {eventTimeStart ? formatTimeDisplayUs(eventTimeStart) : "Choose time"}
            </span>
            <span className="shrink-0 font-brand text-xs tracking-[0.14em] text-gold">TIME</span>
          </button>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <span className={`${fieldLabelClass} block text-center sm:text-left`}>END TIME</span>
          <button
            type="button"
            onClick={() => setTimePickerWhich("end")}
            className={logisticsPickerTriggerClass}
          >
            <span className="font-body text-foreground">
              {eventTimeEnd ? formatTimeDisplayUs(eventTimeEnd) : "Choose time"}
            </span>
            <span className="shrink-0 font-brand text-xs tracking-[0.14em] text-gold">TIME</span>
          </button>
        </div>
      </div>
    </div>
  );

  const dateAndTimeMobile = (
    <div className="block">
      <span className={`${fieldLabelClass} block text-center`}>EVENT DATE & TIME</span>
      <div className="mx-auto mt-2 w-full max-w-5xl space-y-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className={`${fieldLabelClass} block text-center`}>DATE</span>
          <button
            type="button"
            onClick={() => setDatePickerOpen(true)}
            className={logisticsPickerTriggerClass}
          >
            <span className="font-body text-foreground">
              {eventDateIso ? formatDateDisplayUs(eventDateIso) : "Choose date"}
            </span>
            <span className="shrink-0 font-brand text-xs tracking-[0.14em] text-gold">CALENDAR</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className={`${fieldLabelClass} block text-center`}>START</span>
            <button
              type="button"
              onClick={() => setTimePickerWhich("start")}
              className={logisticsPickerTriggerClass}
            >
              <span className="min-w-0 truncate font-body text-foreground">
                {eventTimeStart ? formatTimeDisplayUs(eventTimeStart) : "Time"}
              </span>
              <span className="shrink-0 font-brand text-xs tracking-[0.14em] text-gold">TIME</span>
            </button>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <span className={`${fieldLabelClass} block text-center`}>END</span>
            <button
              type="button"
              onClick={() => setTimePickerWhich("end")}
              className={logisticsPickerTriggerClass}
            >
              <span className="min-w-0 truncate font-body text-foreground">
                {eventTimeEnd ? formatTimeDisplayUs(eventTimeEnd) : "Time"}
              </span>
              <span className="shrink-0 font-brand text-xs tracking-[0.14em] text-gold">TIME</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const locationField = (
    <label className="block">
      <span className={fieldLabelClass}>LOCATION</span>
      <input
        required
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        minLength={3}
        maxLength={120}
        className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-3 font-body text-base text-foreground placeholder:text-foreground outline-none focus:border-gold"
        placeholder="City or venue"
      />
    </label>
  );

  const clientGrid = (
    <div className="grid gap-4 md:grid-cols-3">
      <label className="block">
        <span className={fieldLabelClass}>CLIENT — NAME</span>
        <input
          required
          value={guestFullName}
          onChange={(e) => setGuestFullName(sanitizeNameInput(e.target.value))}
          minLength={3}
          maxLength={90}
          className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-3 font-body text-base text-foreground placeholder:text-foreground outline-none focus:border-gold"
          placeholder="Client full name"
        />
      </label>
      <label className="block">
        <span className={fieldLabelClass}>EMAIL</span>
        <input
          required
          type="email"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          maxLength={120}
          className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-3 font-body text-base text-foreground placeholder:text-foreground outline-none focus:border-gold"
          placeholder="name@example.com"
        />
      </label>
      <label className="block">
        <span className={fieldLabelClass}>PHONE</span>
        <input
          required
          value={guestPhone}
          onChange={(e) => setGuestPhone(sanitizePhoneInput(e.target.value))}
          minLength={10}
          maxLength={20}
          className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-3 font-body text-base text-foreground placeholder:text-foreground outline-none focus:border-gold"
          placeholder="+1 (555) 000-0000"
        />
      </label>
    </div>
  );

  const guestsField = (
    <label className="block">
      <span className={fieldLabelClass}>GUESTS (APPROX.)</span>
      <input
        required
        type="number"
        min={1}
        max={20000}
        value={guestCount}
        onChange={(e) => setGuestCount(sanitizeIntegerInput(e.target.value))}
        className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-3 font-body text-base text-foreground placeholder:text-foreground outline-none focus:border-gold"
        placeholder="e.g. 120"
      />
    </label>
  );

  const notesField = (
    <label className="block">
      <span className={fieldLabelClass}>INTERNAL NOTES</span>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        maxLength={1000}
        className="mt-2 w-full rounded-lg border border-gold/25 px-3 py-3 font-body text-base text-foreground placeholder:text-foreground outline-none focus:border-gold"
        placeholder="Extra details for this booking..."
      />
    </label>
  );

  const submitButtonClass =
    "inline-flex min-h-11 w-full max-w-md items-center justify-center rounded-full border border-gold/40 bg-gold/12 px-7 py-3 font-brand text-xs tracking-[0.16em] text-gold transition hover:bg-gold/22 disabled:opacity-50 sm:w-auto";

  const submitButtonClassMobile =
    "inline-flex min-h-12 w-full max-w-md items-center justify-center rounded-full border border-gold/40 bg-gold/12 px-7 py-3.5 font-brand text-sm tracking-[0.14em] text-gold transition hover:bg-gold/22 disabled:opacity-50";

  return (
    <div className="mx-auto w-full max-w-4xl">
      <AdminBackButton href="/shamell-admin/agenda" label="Back" className="mb-4" />

      <AdminModuleHero
        title={isEditMode ? "Edit booking" : "Book"}
        actionLabel="Availability"
        actionHref="/shamell-admin/agenda/disponibilidad"
        bordered={false}
      />

      {catalogLoading ? (
        <div className="flex justify-center py-12 text-gold">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <form
            id="shamell-agendar-booking-form"
            noValidate
            onSubmit={onSubmit}
            className={cn(
              isMobileLayout
                ? "w-full pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
                : "shamell-glass-surface space-y-4 md:space-y-6 rounded-2xl p-4 sm:p-5 md:p-8",
            )}
          >
            {isMobileLayout ? (
              <div className="mx-auto flex w-full max-w-md flex-col gap-3">
                {(
                  [
                    {
                      id: "event" as const,
                      title: "EVENT SETUP",
                      subtitle: "Type, occasion, service(s)",
                    },
                    {
                      id: "logistics" as const,
                      title: "WHEN & WHERE",
                      subtitle: "Date, time, location",
                    },
                    {
                      id: "client" as const,
                      title: "CLIENT & NOTES",
                      subtitle: "Guest details & notes",
                    },
                  ] as const
                ).map((row) => {
                  const complete = mobileSectionStatus[row.id];
                  return (
                    <motion.div
                      key={row.id}
                      layout
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-xl border px-4 py-4 shadow-sm backdrop-blur-[2px] transition-colors duration-300",
                        complete
                          ? "border-emerald-400/50 bg-emerald-500/12"
                          : "border-gold/25 bg-black/35",
                      )}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-brand text-[13px] tracking-[0.16em] text-gold">{row.title}</p>
                        <p className="mt-1.5 font-body text-sm leading-relaxed text-foreground/68">
                          {row.subtitle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setMobileSectionModal(row.id)}
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors",
                          complete
                            ? "border-emerald-400/45 text-emerald-200 hover:bg-emerald-500/15"
                            : "border-gold/30 text-gold/90 hover:bg-gold/10 hover:text-gold",
                        )}
                        aria-label={`Open ${row.title.toLowerCase()}`}
                      >
                        <Eye className="h-6 w-6" strokeWidth={1.5} aria-hidden />
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <>
                {eventSelects}
                {dateAndTimeDesktop}
                {locationField}
                {clientGrid}
                {guestsField}
                {notesField}
                <button
                  type="submit"
                  disabled={submitting}
                  className={cn(submitButtonClass, "md:max-w-none")}
                >
                  {submitting ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
                  {isEditMode ? "SAVE BOOKING" : "CREATE BOOKING"}
                </button>
              </>
            )}
          </form>

          {isMobileLayout ? (
            <>
              <AdminModal
                title="Event setup"
                isOpen={mobileSectionModal === "event"}
                onClose={() => setMobileSectionModal(null)}
              >
                <div className="space-y-4">{eventSelects}</div>
              </AdminModal>
              <AdminModal
                title="When & where"
                isOpen={mobileSectionModal === "logistics"}
                onClose={() => setMobileSectionModal(null)}
              >
                <div className="space-y-4">
                  {dateAndTimeMobile}
                  {locationField}
                </div>
              </AdminModal>
              <AdminModal
                title="Client & notes"
                isOpen={mobileSectionModal === "client"}
                onClose={() => setMobileSectionModal(null)}
              >
                <div className="space-y-4">
                  {clientGrid}
                  {guestsField}
                  {notesField}
                </div>
              </AdminModal>
            </>
          ) : null}

          {isMobileLayout ? (
            <div className="pointer-events-none fixed inset-x-0 bottom-0 z-130 flex justify-center border-t border-gold/20 bg-[#0b0f14]/95 px-4 py-3 backdrop-blur-md supports-backdrop-filter:bg-[#0b0f14]/88 md:hidden">
              <button
                type="submit"
                form="shamell-agendar-booking-form"
                disabled={submitting}
                className={cn(submitButtonClassMobile, "pointer-events-auto w-full max-w-lg")}
              >
                {submitting ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
                {isEditMode ? "SAVE BOOKING" : "CREATE BOOKING"}
              </button>
            </div>
          ) : null}
        </>
      )}

      <ContactDatePickerModal
        isOpen={datePickerOpen}
        title="Event date"
        value={eventDateIso}
        onClose={() => setDatePickerOpen(false)}
        onConfirm={(iso) => setEventDateIso(iso)}
        blockedIsoDates={blockedIsoDates}
        blockedReasonByIso={blockedReasonByIso}
        minSelectableIso={minSelectableIso}
        overlayZClass={isMobileLayout ? "z-[220]" : "z-[100]"}
      />
      <ContactTimePickerModal
        isOpen={timePickerWhich === "start"}
        title="Event start time"
        value={eventTimeStart}
        onClose={() => setTimePickerWhich(null)}
        onConfirm={(hhmm) => setEventTimeStart(hhmm)}
        timeClamp={startTimeClamp}
        blockedRanges={occupiedRanges}
        overlayZClass={isMobileLayout ? "z-[220]" : "z-100"}
      />
      <ContactTimePickerModal
        isOpen={timePickerWhich === "end"}
        title="Event end time"
        value={eventTimeEnd}
        onClose={() => setTimePickerWhich(null)}
        onConfirm={(hhmm) => setEventTimeEnd(hhmm)}
        timeClamp={startTimeClamp}
        blockedRanges={occupiedRanges}
        overlayZClass={isMobileLayout ? "z-[220]" : "z-100"}
      />
    </div>
  );
}

export default function AgendaAgendarPage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <AgendaAgendarPageContent />
    </Suspense>
  );
}
