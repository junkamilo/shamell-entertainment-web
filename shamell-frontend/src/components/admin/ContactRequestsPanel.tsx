"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import AdminBackButton from "@/components/admin/AdminBackButton";
import AdminModal from "@/components/admin/AdminModal";
import AdminModuleHero from "@/components/admin/AdminModuleHero";
import AdminPagination from "@/components/admin/AdminPagination";
import { InquiryDetailsReadable, buildInquiryDetailRows } from "@/components/admin/InquiryDetailsReadable";
import { formatContactSubjectForAdmin } from "@/lib/adminContactDisplay";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/adminSession";
import {
  buildAdminBookingPayloadFromContactRequest,
  buildContactInboxAgendarHref,
  buildLegacyBookingInquiryRows,
  contactClientCommentFromRequest,
  structuredDetailsForPeticionRow,
} from "@/lib/contactRequestBooking";
import { useAdminContactRequests, type ContactRequest } from "@/hooks/use-admin-contact-requests";
import { useAdminBookings, type AdminBookingRow } from "@/hooks/use-admin-bookings";
import { useAdminPeticiones, type UnifiedPeticionRow } from "@/hooks/use-admin-peticiones";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { bookingServiceDisplayLine } from "@/lib/adminBookingDisplay";

function formatRequestDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatEventCalendarDate(raw: string) {
  const ymd = raw.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) return formatRequestDate(raw);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return formatRequestDate(raw);
  // Use UTC noon to keep the chosen calendar day stable across time zones.
  const stable = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(stable);
}

function formatBookingCalendarDate(raw: string, tz: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: tz }).format(new Date(raw));
  } catch {
    return formatEventCalendarDate(raw);
  }
}

function isoDateFromInstantInTimeZone(instantIso: string, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(instantIso));
  const year = parts.find((p) => p.type === "year")?.value ?? "";
  const month = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return /^\d{4}$/.test(year) && /^\d{2}$/.test(month) && /^\d{2}$/.test(day)
    ? `${year}-${month}-${day}`
    : instantIso.slice(0, 10);
}

function contactIsBookingInquiry(row: ContactRequest): boolean {
  const subject = row.subject?.toLowerCase() ?? "";
  const serviceType = row.serviceType?.toLowerCase() ?? "";
  return subject.includes("booking inquiry") || serviceType.includes("booking inquiry");
}

function contactIsConciergeInquiry(row: ContactRequest): boolean {
  const subject = row.subject?.toLowerCase() ?? "";
  const details =
    row.inquiryDetails && typeof row.inquiryDetails === "object" && !Array.isArray(row.inquiryDetails)
      ? (row.inquiryDetails as Record<string, unknown>)
      : null;
  return subject.includes("concierge inquiry") || details?.entrySource === "concierge_gate";
}

function hhmmFromBookingDate(eventDate: string, tz: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(eventDate));
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

function bookingEditHref(row: AdminBookingRow, tz: string) {
  const params = new URLSearchParams();
  const fullName = row.user?.fullName || row.guestFullName || "";
  const email = row.user?.email || row.guestEmail || "";
  const phone = row.guestPhone || "";
  const eventDate = row.eventDate ? isoDateFromInstantInTimeZone(row.eventDate, tz) : "";
  const details =
    row.bookingDetails && typeof row.bookingDetails === "object"
      ? (row.bookingDetails as Record<string, unknown>)
      : {};
  const start =
    typeof details.eventTimeStart === "string" && /^\d{2}:\d{2}$/.test(details.eventTimeStart)
      ? details.eventTimeStart
      : hhmmFromBookingDate(row.eventDate, tz);
  const end =
    typeof details.eventTimeEnd === "string" && /^\d{2}:\d{2}$/.test(details.eventTimeEnd)
      ? details.eventTimeEnd
      : start;

  if (fullName) params.set("fullName", fullName);
  if (email) params.set("email", email);
  if (phone) params.set("phone", phone);
  if (eventDate) params.set("eventDate", eventDate);
  if (row.location) params.set("location", row.location);
  if (start) params.set("start", start);
  if (end) params.set("end", end);
  if (row.notes) params.set("message", row.notes.slice(0, 500));
  if (row.service?.id) params.set("serviceId", row.service.id);
  if (row.eventType?.id) params.set("eventTypeId", row.eventType.id);
  if (row.occasionType?.id) params.set("occasionTypeId", row.occasionType.id);
  params.set("origin", "booking");
  params.set("bookingId", row.id);
  params.set("returnTo", "/shamell-admin/agenda/peticiones");

  return `/shamell-admin/agenda/agendar?${params.toString()}`;
}

function RequestCard({
  row,
  expanded,
  onToggle,
  onCancel,
  onRemove,
  onReserveFromContact,
  onCancelBooking,
  onRemoveBooking,
  busyId,
  reservingContactId,
  serviceByInquiryCode,
  eventTypeContactCodeById,
  inquiryCodeByCatalogLineId,
  fallbackServiceId,
  bookingTz,
}: {
  row: UnifiedPeticionRow;
  expanded: boolean;
  onToggle: () => void;
  onCancel: () => void;
  onRemove: () => void;
  onReserveFromContact: (row: ContactRequest) => void;
  onCancelBooking: (row: AdminBookingRow) => void;
  onRemoveBooking: (row: AdminBookingRow) => void;
  busyId: string | null;
  reservingContactId: string | null;
  serviceByInquiryCode: Map<string, string>;
  eventTypeContactCodeById: Map<string, string>;
  inquiryCodeByCatalogLineId: Map<string, string>;
  fallbackServiceId?: string;
  bookingTz: string;
}) {
  const busy = busyId === row.id;
  const reserving = row.origin === "CONTACT" && reservingContactId === row.id;
  const contact = row.origin === "CONTACT" ? row.contact : null;
  const contactRow = row.origin === "CONTACT" ? row : null;
  const booking = row.origin === "BOOKING_ADMIN" ? row.booking : null;
  const linkedContact = row.origin === "BOOKING_ADMIN" ? (row.linkedContact ?? null) : null;

  const structuredDetails = useMemo(
    () => structuredDetailsForPeticionRow(contact, booking, linkedContact),
    [contact, booking, linkedContact],
  );

  const inquiryRows = useMemo(() => {
    const fromJson = buildInquiryDetailRows(structuredDetails);
    if (fromJson.length > 0) return fromJson;
    if (booking) return buildLegacyBookingInquiryRows(booking, bookingTz);
    return [];
  }, [structuredDetails, booking, bookingTz]);

  const showLegacyBookingHint = Boolean(
    booking && buildInquiryDetailRows(structuredDetails).length === 0 && inquiryRows.length > 0,
  );

  const clientComment = useMemo(() => {
    if (contact) {
      return contactClientCommentFromRequest(contact.message, contact.inquiryDetails);
    }
    if (linkedContact) {
      return contactClientCommentFromRequest(linkedContact.message, linkedContact.inquiryDetails);
    }
    return booking?.notes?.trim() || "No notes.";
  }, [booking?.notes, contact, linkedContact]);
  const manualAgendarHref = useMemo(
    () => {
      if (contact) {
        return buildContactInboxAgendarHref(contact, {
          serviceByInquiryCode,
          eventTypeContactCodeById,
          inquiryCodeByCatalogLineId,
          fallbackServiceId,
        });
      }
      return booking ? bookingEditHref(booking, bookingTz) : "/shamell-admin/agenda/agendar";
    },
    [booking, bookingTz, contact, eventTypeContactCodeById, fallbackServiceId, inquiryCodeByCatalogLineId, serviceByInquiryCode],
  );

  const isReserved = row.origin === "CONTACT" ? row.state === "RESERVED" : row.status === "CONFIRMED";
  const isCancelled = row.origin === "CONTACT" ? row.state === "CANCELLED" : row.status === "CANCELLED";

  return (
    <article
      className={cn(
        "shamell-glass-surface min-w-0 rounded-xl px-4 py-3 transition-colors",
        isReserved
          ? "border-emerald-400/30 ring-1 ring-emerald-400/15"
          : isCancelled
            ? "border-red-400/25 ring-1 ring-red-400/10 opacity-85"
            : "border-gold/40 ring-1 ring-gold/15",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start gap-3 text-left"
      >
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/10">
          <Mail className="h-4 w-4 text-gold" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-brand text-base tracking-wide text-gold sm:text-lg">
              {contact?.fullName || booking?.guestFullName || booking?.user?.fullName || "Client"}
            </span>
            {isReserved ? (
              <span className="rounded border border-emerald-400/45 px-2 py-0.5 font-brand text-[10px] tracking-widest text-emerald-200 sm:text-xs">
                RESERVED
              </span>
            ) : isCancelled ? (
              <span className="rounded border border-red-400/45 px-2 py-0.5 font-brand text-[10px] tracking-widest text-red-200 sm:text-xs">
                CANCELED
              </span>
            ) : (
              <span className="rounded border border-gold/40 px-2 py-0.5 font-brand text-[10px] tracking-widest text-gold sm:text-xs">
                NEW
              </span>
            )}
          </div>
          <p className="truncate text-sm text-foreground/60 sm:text-base">
            {contact?.email || booking?.guestEmail || booking?.user?.email}
          </p>
          <p className="mt-1 line-clamp-2 font-body text-sm text-foreground/70 sm:text-base">
            {contact
              ? formatContactSubjectForAdmin(contact.subject)
              : booking?.event?.name ||
                  booking?.eventType?.name ||
                  bookingServiceDisplayLine(booking) ||
                  "Admin booking"}
          </p>
          <p className="mt-1 font-brand text-xs tracking-widest text-foreground/45 sm:text-sm">
            {formatRequestDate(row.createdAt)}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="mt-1 h-4 w-4 shrink-0 text-gold/70" strokeWidth={1.5} />
        ) : (
          <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-gold/70" strokeWidth={1.5} />
        )}
      </button>

      {expanded ? (
        <div className="mt-4 min-w-0 space-y-4 border-t border-gold/10 pt-4 pl-0 md:pl-12">
          <dl className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2 sm:gap-y-3 sm:text-base">
            {(contact?.phone || booking?.guestPhone) ? (
              <>
                <dt className="font-brand text-xs tracking-widest text-gold/65 sm:text-sm">PHONE</dt>
                <dd className="min-w-0 wrap-break-word font-body text-foreground/85">{contact?.phone || booking?.guestPhone}</dd>
              </>
            ) : null}
            {(contact?.eventDate || booking?.eventDate) ? (
              <>
                <dt className="font-brand text-xs tracking-widest text-gold/65 sm:text-sm">EVENT DATE</dt>
                <dd className="min-w-0 wrap-break-word font-body text-foreground/85">
                  {contact
                    ? formatEventCalendarDate(contact.eventDate || "")
                    : formatBookingCalendarDate(booking?.eventDate || "", bookingTz)}
                </dd>
              </>
            ) : null}
            {(contact?.location || booking?.location) ? (
              <>
                <dt className="font-brand text-xs tracking-widest text-gold/65 sm:text-sm">CITY / VENUE</dt>
                <dd className="min-w-0 wrap-break-word font-body text-foreground/85">{contact?.location || booking?.location}</dd>
              </>
            ) : null}
          </dl>
          {inquiryRows.length > 0 ? <InquiryDetailsReadable rows={inquiryRows} /> : null}
          {showLegacyBookingHint ? (
            <p className="font-body text-xs leading-relaxed text-foreground/50 sm:text-sm">
              No structured form snapshot on this booking; showing catalog fields only.
            </p>
          ) : null}
          {!(
            (contact ?? linkedContact) &&
            contactIsConciergeInquiry((contact ?? linkedContact)!) &&
            inquiryRows.length > 0
          ) ? (
            <div className="min-w-0">
              <p className="mb-2 font-brand text-xs tracking-widest text-gold/65 sm:text-sm">
                {inquiryRows.length > 0 ? "CLIENT COMMENT" : "MESSAGE / NOTES"}
              </p>
              <p className="shamell-glass-surface shamell-scrollbar max-h-56 min-w-0 overflow-y-auto whitespace-pre-wrap wrap-break-word rounded-lg p-4 font-body text-base leading-relaxed text-foreground/85 sm:max-h-64 sm:p-5 sm:text-lg sm:leading-relaxed">
                {clientComment}
              </p>
            </div>
          ) : null}
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch">
            {contactRow ? (
              <button
                type="button"
                disabled={
                  busy ||
                  reserving ||
                  contactRow.state !== "PENDING" ||
                  Boolean(row.origin === "CONTACT" && row.hasLinkedBooking)
                }
                onClick={(e) => {
                  e.stopPropagation();
                  onReserveFromContact(contactRow.contact);
                }}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-md border px-3 py-3 font-brand text-xs tracking-widest transition disabled:opacity-50 sm:w-auto sm:py-2.5 sm:text-sm",
                  contactRow.state === "RESERVED"
                    ? "border-emerald-400/45 text-emerald-200"
                    : "border-gold/35 text-gold hover:bg-gold/10",
                )}
              >
                {reserving ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : null}
                {contactRow.state === "RESERVED" ? "Reserved" : "Reserve"}
              </button>
            ) : null}
            <Link
              href={manualAgendarHref}
              className="inline-flex w-full items-center justify-center rounded-md border border-gold/20 px-3 py-3 text-center font-brand text-xs tracking-widest text-foreground/70 transition hover:border-gold/35 hover:text-gold sm:w-auto sm:py-2.5 sm:text-sm"
            >
              Edit
            </Link>
            <button
              type="button"
              disabled={busy || reserving}
              onClick={(e) => {
                e.stopPropagation();
                if (contact) onCancel();
                else if (booking) onCancelBooking(booking);
              }}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-red-300/35 px-3 py-3 font-brand text-xs tracking-widest text-red-200/90 transition hover:bg-red-500/10 disabled:opacity-50 sm:w-auto sm:py-2.5 sm:text-sm"
            >
              <XCircle className="h-4 w-4" strokeWidth={1.5} />
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || reserving || !isCancelled}
              onClick={(e) => {
                e.stopPropagation();
                if (contact) onRemove();
                else if (booking) onRemoveBooking(booking);
              }}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-red-400/35 px-3 py-3 font-brand text-xs tracking-widest text-red-200/90 transition hover:bg-red-500/10 disabled:opacity-50 sm:w-auto sm:py-2.5 sm:text-sm"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              Delete
            </button>
          </div>
          {!(contact && contactIsConciergeInquiry(contact)) ? (
            <p className="wrap-break-word font-body text-xs leading-relaxed text-foreground/50 sm:text-sm">
              {contact && contactIsBookingInquiry(contact)
                ? "Booking inquiry from the public form: use Reserve only if a calendar booking was not created automatically (missing phone or catalog match)."
                : "Bookings from the public form or Book appear here as reserved (green)."}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export type ContactRequestsPanelProps = {
  heroTitle?: string;
  heroSubtitle?: string;
};

function apiBase() {
  return (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, "");
}

export default function ContactRequestsPanel({
  heroTitle = "Inbox",
  heroSubtitle = "",
}: ContactRequestsPanelProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [activeLane, setActiveLane] = useState<"bookings" | "guidance">("bookings");
  const { rows: unifiedRows, meta: unifiedMeta, isLoading, error, reload: reloadPeticiones } = useAdminPeticiones(true, {
    page,
    perPage,
    lane: activeLane,
  });
  const {
    reload: reloadContacts,
    remove,
    setStatus,
  } = useAdminContactRequests(false);
  const {
    reload: reloadBookings,
    createBooking,
    patchBooking,
    removeBooking,
  } = useAdminBookings(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reservingContactId, setReservingContactId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<null | {
    kind: "CONTACT" | "BOOKING";
    id: string;
    title: string;
    description: string;
    linkedContactId?: string;
  }>(null);
  const [purgeLinkedInquiryOnDelete, setPurgeLinkedInquiryOnDelete] = useState(true);
  const [serviceByInquiryCode, setServiceByInquiryCode] = useState<Map<string, string>>(new Map());
  const [eventTypeContactCodeById, setEventTypeContactCodeById] = useState<Map<string, string>>(new Map());
  const [inquiryCodeByCatalogLineId, setInquiryCodeByCatalogLineId] = useState<Map<string, string>>(new Map());
  const [fallbackServiceId, setFallbackServiceId] = useState<string | undefined>(undefined);

  const bookingTz = useMemo(() => process.env.NEXT_PUBLIC_BOOKING_TZ ?? "America/New_York", []);

  useEffect(() => {
    setExpandedId(null);
  }, [activeLane]);

  const pendingCount = useMemo(
    () =>
      unifiedRows.filter((r) => (r.origin === "CONTACT" ? r.state === "PENDING" : r.status === "PENDING")).length,
    [unifiedRows],
  );

  useEffect(() => {
    if (page <= unifiedMeta.totalPages) return;
    const nextPage = unifiedMeta.totalPages;
    const timer = window.setTimeout(() => {
      setPage(nextPage);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [page, unifiedMeta.totalPages]);

  /** Same source as public form: catalog line id → inquiry code (no JWT). */
  useEffect(() => {
    let cancelled = false;
    fetch(`${apiBase()}/api/v1/events/contact-lines`)
      .then((r) => r.json())
      .then((json: unknown) => {
        if (cancelled || !Array.isArray(json)) return;
        const map = new Map<string, string>();
        for (const x of json) {
          if (!x || typeof x !== "object") continue;
          const o = x as Record<string, unknown>;
          const id = typeof o.id === "string" ? o.id.trim() : "";
          const code = typeof o.contactInquiryCode === "string" ? o.contactInquiryCode.trim() : "";
          if (id && code) map.set(id, code);
        }
        setInquiryCodeByCatalogLineId(map);
      })
      .catch(() => {
        if (!cancelled) setInquiryCodeByCatalogLineId(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY) : null;
    if (!token) {
      Promise.resolve().then(() => {
        setServiceByInquiryCode(new Map());
        setEventTypeContactCodeById(new Map());
        setFallbackServiceId(undefined);
      });
      return;
    }
    let cancelled = false;

    fetch(`${apiBase()}/api/v1/services/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json: unknown) => {
        if (cancelled || !Array.isArray(json)) return;
        const map = new Map<string, string>();
        const activeServiceIds: string[] = [];
        for (const x of json) {
          if (!x || typeof x !== "object") continue;
          const o = x as Record<string, unknown>;
          const id = typeof o.id === "string" ? o.id.trim() : "";
          const code = typeof o.contactInquiryCode === "string" ? o.contactInquiryCode.trim() : "";
          const isActive = o.isActive !== false;
          if (id && isActive) activeServiceIds.push(id);
          if (id && code && !map.has(code)) map.set(code, id);
        }
        setServiceByInquiryCode(map);
        // Operational fallback: if no code/event mapping, use first active service.
        setFallbackServiceId(activeServiceIds.length > 0 ? activeServiceIds[0] : undefined);
      })
      .catch(() => {
        if (!cancelled) {
          setServiceByInquiryCode(new Map());
          setFallbackServiceId(undefined);
        }
      });

    fetch(`${apiBase()}/api/v1/events/types/admin`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json: unknown) => {
        if (cancelled || !Array.isArray(json)) return;
        const map = new Map<string, string>();
        for (const x of json) {
          if (!x || typeof x !== "object") continue;
          const o = x as Record<string, unknown>;
          const id = typeof o.id === "string" ? o.id.trim() : "";
          const code = typeof o.contactInquiryCode === "string" ? o.contactInquiryCode.trim() : "";
          if (id && code) map.set(id, code);
        }
        setEventTypeContactCodeById(map);
      })
      .catch(() => {
        if (!cancelled) setEventTypeContactCodeById(new Map());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const onReserveFromContact = useCallback(
    async (row: ContactRequest) => {
      if (contactIsConciergeInquiry(row)) {
        router.push(
          buildContactInboxAgendarHref(row, {
            serviceByInquiryCode,
            eventTypeContactCodeById,
            inquiryCodeByCatalogLineId,
            fallbackServiceId,
          }),
        );
        return;
      }

      const built = buildAdminBookingPayloadFromContactRequest(
        row,
        serviceByInquiryCode,
        bookingTz,
        eventTypeContactCodeById,
        inquiryCodeByCatalogLineId,
        fallbackServiceId,
      );
      if (!built.ok) {
        toast({
          title: "Cannot create booking automatically",
          description: built.error,
          variant: "destructive",
        });
        return;
      }
      setReservingContactId(row.id);
      try {
        await createBooking({ ...built.payload, contactRequestId: row.id });
        await setStatus(row.id, "RESERVED");
        toast({
          title: "Booking created",
          description: "The booking was saved from this request (source: contact).",
        });
        reloadContacts();
        reloadBookings();
        reloadPeticiones();
      } catch (e) {
        const message = e instanceof Error ? e.message : "Try again or open Book to enter it manually.";
        toast({
          title: message.includes("already has a calendar booking")
            ? "Booking already exists"
            : "Could not create booking",
          description: message,
          variant: "destructive",
        });
      } finally {
        setReservingContactId(null);
      }
    },
    [
      bookingTz,
      createBooking,
      eventTypeContactCodeById,
      fallbackServiceId,
      inquiryCodeByCatalogLineId,
      reloadBookings,
      reloadContacts,
      reloadPeticiones,
      router,
      serviceByInquiryCode,
      setStatus,
    ],
  );

  const onCancelContact = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await setStatus(id, "CANCELLED");
        toast({ title: "Request canceled" });
        reloadContacts();
        reloadPeticiones();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Try again.",
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    },
    [reloadContacts, reloadPeticiones, setStatus],
  );

  const onRemove = useCallback(
    async (id: string) => {
      const row = unifiedRows.find((r) => r.origin === "CONTACT" && r.id === id);
      const state = row?.origin === "CONTACT" ? row.state : "PENDING";
      if (state !== "CANCELLED") {
        toast({
          title: "Action not allowed",
          description: "You can only delete a request after it has been canceled.",
          variant: "destructive",
        });
        return;
      }
      setConfirmDelete({
        kind: "CONTACT",
        id,
        title: "Delete request",
        description: "This will permanently delete the request.",
      });
    },
    [unifiedRows],
  );

  const confirmRemoveContact = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await remove(id);
        setExpandedId((cur) => (cur === id ? null : cur));
        toast({ title: "Request deleted" });
        reloadContacts();
        reloadPeticiones();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Try again.",
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    },
    [reloadContacts, reloadPeticiones, remove],
  );

  const onCancelBooking = useCallback(
    async (row: AdminBookingRow) => {
      if (row.status === "CANCELLED") return;
      setBusyId(row.id);
      try {
        await patchBooking(row.id, { status: "CANCELLED" });
        toast({ title: "Booking canceled" });
        reloadBookings();
        reloadPeticiones();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Try again.",
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    },
    [patchBooking, reloadBookings, reloadPeticiones],
  );

  const onRemoveBooking = useCallback(
    async (row: AdminBookingRow) => {
      if (row.status !== "CANCELLED") {
        toast({
          title: "Action not allowed",
          description: "You can only delete a booking after it has been canceled.",
          variant: "destructive",
        });
        return;
      }
      const unified = unifiedRows.find(
        (r) => r.origin === "BOOKING_ADMIN" && r.booking.id === row.id,
      );
      const linkedContactId =
        unified?.origin === "BOOKING_ADMIN" ? unified.linkedContact?.id : undefined;
      setPurgeLinkedInquiryOnDelete(Boolean(linkedContactId));
      setConfirmDelete({
        kind: "BOOKING",
        id: row.id,
        linkedContactId,
        title: "Delete canceled booking",
        description: linkedContactId
          ? "This will permanently delete the canceled booking. You can also remove the linked inquiry so it does not reappear in the inbox."
          : "This will permanently delete the canceled booking.",
      });
    },
    [unifiedRows],
  );

  const confirmRemoveBooking = useCallback(
    async (id: string, linkedContactId?: string, purgeLinked?: boolean) => {
      setBusyId(id);
      try {
        await removeBooking(id, {
          purgeContact: Boolean(purgeLinked && linkedContactId),
        });
        setExpandedId((cur) => (cur === id ? null : cur));
        toast({ title: "Booking deleted" });
        reloadBookings();
        reloadPeticiones();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Try again.",
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    },
    [reloadBookings, reloadPeticiones, removeBooking],
  );

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl">
      <AdminBackButton href="/shamell-admin/agenda" label="Back" className="mb-4" />
      <AdminModuleHero
        title={heroTitle}
        subtitle={heroSubtitle}
        actionLabel="View calendar"
        actionHref="/shamell-admin/agenda/mi-agenda"
        bordered={false}
      />

      <div className="mb-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveLane("bookings");
            setPage(1);
          }}
          className={
            activeLane === "bookings"
              ? "rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5"
              : "rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5"
          }
        >
          BOOKINGS & REQUESTS
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveLane("guidance");
            setPage(1);
          }}
          className={
            activeLane === "guidance"
              ? "rounded-full border border-gold/40 bg-gold/12 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-gold sm:px-4 sm:py-1.5"
              : "rounded-full border border-gold/18 px-3 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/60 hover:border-gold/35 hover:text-gold sm:px-4 sm:py-1.5"
          }
        >
          GUIDANCE
        </button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-foreground/55">
          <span>
            Total: <strong className="text-gold/90">{isLoading ? "…" : unifiedMeta.totalItems}</strong>
          </span>
          <span className="text-gold/30">|</span>
          <span>
            Pending: <strong className="text-gold/90">{isLoading ? "…" : pendingCount}</strong>
          </span>
          {error ? (
            <>
              <span className="text-gold/30">|</span>
              <span className="text-red-300/90">{error}</span>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              reloadPeticiones();
            }}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-gold transition hover:bg-gold/10 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />}
            REFRESH
          </button>
        </div>
      </div>

      <section className="shamell-glass-surface rounded-2xl p-5 md:p-7">
        <div className="min-w-0 space-y-3">
          {isLoading && unifiedRows.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-foreground/50">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
              Loading…
            </div>
          ) : null}

          {!isLoading && unifiedRows.length === 0 && !error ? (
            <p className="shamell-glass-surface rounded-xl py-12 text-center font-body text-sm text-foreground/50">
              {activeLane === "guidance"
                ? "No concierge guidance requests in this inbox yet."
                : "No bookings or open contact requests in this view yet."}
            </p>
          ) : null}

          {unifiedRows.map((row) => (
            <RequestCard
              key={row.id}
              row={row}
              expanded={expandedId === row.id}
              onToggle={() => setExpandedId((id) => (id === row.id ? null : row.id))}
              onCancel={() => onCancelContact(row.id)}
              onRemove={() => onRemove(row.id)}
              onReserveFromContact={onReserveFromContact}
              onCancelBooking={onCancelBooking}
              onRemoveBooking={onRemoveBooking}
              busyId={busyId}
              reservingContactId={reservingContactId}
              serviceByInquiryCode={serviceByInquiryCode}
              eventTypeContactCodeById={eventTypeContactCodeById}
              inquiryCodeByCatalogLineId={inquiryCodeByCatalogLineId}
              fallbackServiceId={fallbackServiceId}
              bookingTz={bookingTz}
            />
          ))}
        </div>
        <AdminPagination
          className="mt-6 border-t border-gold/10 pt-4"
          meta={unifiedMeta}
          onPageChange={(next) => setPage(next)}
          onPerPageChange={(next) => {
            setPerPage(next);
            setPage(1);
          }}
        />
      </section>

      <AdminModal
        title={confirmDelete?.title ?? "Confirm action"}
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground/75">{confirmDelete?.description}</p>
          {confirmDelete?.kind === "BOOKING" && confirmDelete.linkedContactId ? (
            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-gold/15 bg-black/20 px-3 py-2.5">
              <input
                type="checkbox"
                checked={purgeLinkedInquiryOnDelete}
                onChange={(e) => setPurgeLinkedInquiryOnDelete(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-gold"
              />
              <span className="font-body text-sm leading-snug text-foreground/80">
                Also delete the linked inquiry (recommended — prevents it from showing again in the
                inbox)
              </span>
            </label>
          ) : null}
          <p className="text-xs text-foreground/50">You cannot undo this action.</p>
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="rounded-md border border-gold/25 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/70 hover:border-gold/35 hover:text-gold"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!confirmDelete) return;
                const payload = confirmDelete;
                setConfirmDelete(null);
                if (payload.kind === "CONTACT") {
                  await confirmRemoveContact(payload.id);
                } else {
                  await confirmRemoveBooking(
                    payload.id,
                    payload.linkedContactId,
                    purgeLinkedInquiryOnDelete,
                  );
                }
              }}
              className="rounded-md border border-red-400/45 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-red-200 hover:bg-red-500/10"
            >
              DELETE
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
