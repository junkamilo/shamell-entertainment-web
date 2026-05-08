"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
  buildAgendarPrefillHref,
  contactClientCommentFromRequest,
} from "@/lib/contactRequestBooking";
import { useAdminContactRequests, type ContactRequest } from "@/hooks/use-admin-contact-requests";
import { useAdminBookings, type AdminBookingRow } from "@/hooks/use-admin-bookings";
import { useAdminPeticiones } from "@/hooks/use-admin-peticiones";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function formatRequestDate(iso: string) {
  try {
    return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
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
  return new Intl.DateTimeFormat("es", { dateStyle: "medium" }).format(stable);
}

function formatBookingCalendarDate(raw: string, tz: string) {
  try {
    return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeZone: tz }).format(new Date(raw));
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

type UnifiedPeticionRow =
  | {
      origin: "CONTACT";
      id: string;
      createdAt: string;
      state: "PENDING" | "RESERVED" | "CANCELLED";
      contact: ContactRequest;
    }
  | {
      origin: "BOOKING_ADMIN";
      id: string;
      createdAt: string;
      status: string;
      booking: AdminBookingRow;
    };

function contactIsBookingInquiry(row: ContactRequest): boolean {
  const subject = row.subject?.toLowerCase() ?? "";
  const serviceType = row.serviceType?.toLowerCase() ?? "";
  return subject.includes("booking inquiry") || serviceType.includes("booking inquiry");
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
  const booking = row.origin === "BOOKING_ADMIN" ? row.booking : null;
  const inquiryRows = useMemo(
    () => (contact ? buildInquiryDetailRows(contact.inquiryDetails) : []),
    [contact],
  );
  const clientComment = useMemo(() => {
    if (!contact) return booking?.notes?.trim() || "Sin notas.";
    return contactClientCommentFromRequest(contact.message, contact.inquiryDetails);
  }, [booking?.notes, contact]);
  const manualAgendarHref = useMemo(
    () => {
      if (contact) {
        const raw = buildAgendarPrefillHref(contact, {
          serviceByInquiryCode,
          eventTypeContactCodeById,
          inquiryCodeByCatalogLineId,
          fallbackServiceId,
        });
        const url = new URL(raw, "http://localhost");
        url.searchParams.set("origin", "contact");
        url.searchParams.set("contactId", contact.id);
        url.searchParams.set("returnTo", "/shamell-admin/agenda/peticiones");
        return `${url.pathname}?${url.searchParams.toString()}`;
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
        "shamell-glass-surface rounded-xl px-4 py-3 transition-colors",
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
            <span className="font-brand text-sm tracking-wide text-gold">
              {contact?.fullName || booking?.guestFullName || booking?.user?.fullName || "Cliente"}
            </span>
            {isReserved ? (
              <span className="rounded border border-emerald-400/45 px-1.5 py-0.5 font-brand text-[9px] tracking-widest text-emerald-200">
                RESERVADA
              </span>
            ) : isCancelled ? (
              <span className="rounded border border-red-400/45 px-1.5 py-0.5 font-brand text-[9px] tracking-widest text-red-200">
                CANCELADA
              </span>
            ) : (
              <span className="rounded border border-gold/40 px-1.5 py-0.5 font-brand text-[9px] tracking-widest text-gold">
                NUEVA
              </span>
            )}
          </div>
          <p className="truncate text-xs text-foreground/55">{contact?.email || booking?.guestEmail || booking?.user?.email}</p>
          <p className="mt-1 line-clamp-2 font-body text-xs text-foreground/65">
            {contact
              ? formatContactSubjectForAdmin(contact.subject)
              : booking?.event?.name || booking?.eventType?.name || booking?.service?.serviceType?.name || "Reserva admin"}
          </p>
          <p className="mt-1 font-brand text-[10px] tracking-widest text-foreground/40">
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
        <div className="mt-4 space-y-3 border-t border-gold/10 pt-4 pl-0 md:pl-12">
          <dl className="grid gap-2 text-xs sm:grid-cols-2">
            {(contact?.phone || booking?.guestPhone) ? (
              <>
                <dt className="font-brand text-[10px] tracking-widest text-gold/60">TELÉFONO</dt>
                <dd className="text-foreground/80">{contact?.phone || booking?.guestPhone}</dd>
              </>
            ) : null}
            {(contact?.eventDate || booking?.eventDate) ? (
              <>
                <dt className="font-brand text-[10px] tracking-widest text-gold/60">FECHA EVENTO</dt>
                <dd className="text-foreground/80">
                  {contact
                    ? formatEventCalendarDate(contact.eventDate || "")
                    : formatBookingCalendarDate(booking?.eventDate || "", bookingTz)}
                </dd>
              </>
            ) : null}
            {(contact?.location || booking?.location) ? (
              <>
                <dt className="font-brand text-[10px] tracking-widest text-gold/60">UBICACIÓN</dt>
                <dd className="text-foreground/80">{contact?.location || booking?.location}</dd>
              </>
            ) : null}
          </dl>
          {contact ? <InquiryDetailsReadable rows={inquiryRows} /> : null}
          <div>
            <p className="mb-1 font-brand text-[10px] tracking-widest text-gold/60">
              {inquiryRows.length > 0 ? "COMENTARIO DEL CLIENTE" : "MENSAJE / NOTAS"}
            </p>
            <p className="shamell-glass-surface whitespace-pre-wrap rounded-lg p-3 font-body text-sm leading-relaxed text-foreground/80">
              {clientComment}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {contact ? (
              <button
                type="button"
                disabled={busy || reserving || row.state !== "PENDING"}
                onClick={(e) => {
                  e.stopPropagation();
                  onReserveFromContact(contact);
                }}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 font-brand text-[10px] tracking-widest transition disabled:opacity-50",
                  row.state === "RESERVED"
                    ? "border-emerald-400/45 text-emerald-200"
                    : "border-gold/35 text-gold hover:bg-gold/10",
                )}
              >
                {reserving ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} /> : null}
                {row.state === "RESERVED" ? "Reservada" : "Reservar"}
              </button>
            ) : null}
            <Link
              href={manualAgendarHref}
              className="rounded-md border border-gold/20 px-3 py-2 font-brand text-[10px] tracking-widest text-foreground/65 transition hover:border-gold/35 hover:text-gold"
            >
              Editar
            </Link>
            <button
              type="button"
              disabled={busy || reserving}
              onClick={(e) => {
                e.stopPropagation();
                if (contact) onCancel();
                else if (booking) onCancelBooking(booking);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-300/35 px-3 py-2 font-brand text-[10px] tracking-widest text-red-200/90 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
              Cancelar
            </button>
            <button
              type="button"
              disabled={busy || reserving || !isCancelled}
              onClick={(e) => {
                e.stopPropagation();
                if (contact) onRemove();
                else if (booking) onRemoveBooking(booking);
              }}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-400/35 px-3 py-2 font-brand text-[10px] tracking-widest text-red-200/90 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              Eliminar
            </button>
          </div>
          <p className="font-body text-[10px] leading-relaxed text-foreground/40">
            {contact && contactIsBookingInquiry(contact)
              ? "Esta petición viene de BOOKING INQUIRY: la reserva debe confirmarse manualmente tras contactar al cliente."
              : "Las reservas creadas desde Agendar aparecen aquí como reservadas (verde)."}
          </p>
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
  heroTitle = "Bandeja de entrada",
  heroSubtitle = "",
}: ContactRequestsPanelProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const { rows: unifiedRows, meta: unifiedMeta, isLoading, error, reload: reloadPeticiones } = useAdminPeticiones(true, {
    page,
    perPage,
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
  }>(null);
  const [serviceByInquiryCode, setServiceByInquiryCode] = useState<Map<string, string>>(new Map());
  const [eventTypeContactCodeById, setEventTypeContactCodeById] = useState<Map<string, string>>(new Map());
  const [inquiryCodeByCatalogLineId, setInquiryCodeByCatalogLineId] = useState<Map<string, string>>(new Map());
  const [fallbackServiceId, setFallbackServiceId] = useState<string | undefined>(undefined);

  const bookingTz = useMemo(() => process.env.NEXT_PUBLIC_BOOKING_TZ ?? "America/New_York", []);

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

  /** Misma fuente que el formulario público: id de línea → código de consulta (no requiere JWT). */
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
        // Fallback operativo: si no hay mapeo por código/evento, usar el primer servicio activo.
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
          title: "No se puede crear la reserva automática",
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
          title: "Reserva creada",
          description: "Se guardó la reserva con los datos de esta petición (origen: contacto).",
        });
        reloadContacts();
        reloadBookings();
        reloadPeticiones();
      } catch (e) {
        toast({
          title: "Error al crear la reserva",
          description: e instanceof Error ? e.message : "Intenta de nuevo o usa «Abrir en Agendar».",
          variant: "destructive",
        });
      } finally {
        setReservingContactId(null);
      }
    },
    [bookingTz, createBooking, eventTypeContactCodeById, fallbackServiceId, inquiryCodeByCatalogLineId, reloadBookings, reloadContacts, reloadPeticiones, serviceByInquiryCode, setStatus],
  );

  const onCancelContact = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await setStatus(id, "CANCELLED");
        toast({ title: "Petición cancelada" });
        reloadContacts();
        reloadPeticiones();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Intenta de nuevo.",
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
          title: "Acción no permitida",
          description: "Solo puedes eliminar una petición cuando esté cancelada.",
          variant: "destructive",
        });
        return;
      }
      setConfirmDelete({
        kind: "CONTACT",
        id,
        title: "Eliminar solicitud",
        description: "Esta acción eliminará la solicitud de forma permanente.",
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
        toast({ title: "Solicitud eliminada" });
        reloadContacts();
        reloadPeticiones();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Intenta de nuevo.",
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
        toast({ title: "Reserva cancelada" });
        reloadBookings();
        reloadPeticiones();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Intenta de nuevo.",
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
          title: "Acción no permitida",
          description: "Solo puedes eliminar una reserva cuando esté cancelada.",
          variant: "destructive",
        });
        return;
      }
      setConfirmDelete({
        kind: "BOOKING",
        id: row.id,
        title: "Eliminar reserva cancelada",
        description: "Esta acción eliminará la reserva cancelada de forma permanente.",
      });
    },
    [],
  );

  const confirmRemoveBooking = useCallback(
    async (id: string) => {
      setBusyId(id);
      try {
        await removeBooking(id);
        setExpandedId((cur) => (cur === id ? null : cur));
        toast({ title: "Reserva eliminada" });
        reloadBookings();
        reloadPeticiones();
      } catch (e) {
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Intenta de nuevo.",
          variant: "destructive",
        });
      } finally {
        setBusyId(null);
      }
    },
    [reloadBookings, reloadPeticiones, removeBooking],
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <AdminBackButton href="/shamell-admin/agenda" label="Volver" className="mb-4" />
      <AdminModuleHero
        title={heroTitle}
        subtitle={heroSubtitle}
        actionLabel="Ver agenda"
        actionHref="/shamell-admin/agenda/mi-agenda"
        bordered={false}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-foreground/55">
          <span>
            Total: <strong className="text-gold/90">{isLoading ? "…" : unifiedMeta.totalItems}</strong>
          </span>
          <span className="text-gold/30">|</span>
          <span>
            Pendientes: <strong className="text-gold/90">{isLoading ? "…" : pendingCount}</strong>
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
            ACTUALIZAR
          </button>
        </div>
      </div>

      <section className="shamell-glass-surface rounded-2xl p-5 md:p-7">
        <div className="space-y-3">
          {isLoading && unifiedRows.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-foreground/50">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
              Cargando…
            </div>
          ) : null}

          {!isLoading && unifiedRows.length === 0 && !error ? (
            <p className="shamell-glass-surface rounded-xl py-12 text-center font-body text-sm text-foreground/50">
              Aún no hay peticiones ni reservas para listar.
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
        title={confirmDelete?.title ?? "Confirmar acción"}
        isOpen={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-foreground/75">{confirmDelete?.description}</p>
          <p className="text-xs text-foreground/50">No podrás deshacer esta acción.</p>
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(null)}
              className="rounded-md border border-gold/25 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-foreground/70 hover:border-gold/35 hover:text-gold"
            >
              CANCELAR
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
                  await confirmRemoveBooking(payload.id);
                }
              }}
              className="rounded-md border border-red-400/45 px-4 py-2 font-brand text-[10px] tracking-[0.14em] text-red-200 hover:bg-red-500/10"
            >
              ELIMINAR
            </button>
          </div>
        </div>
      </AdminModal>
    </div>
  );
}
