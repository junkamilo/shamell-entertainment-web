import type { ContactRequest } from "@/hooks/use-admin-contact-requests";
import type { CreateAdminBookingPayload } from "@/hooks/use-admin-bookings";
import { buildInquiryDetailRows } from "@/components/admin/InquiryDetailsReadable";
import { hhmmToMinutes } from "@/components/contact/contactLogisticsUtils";
import { utcInstantForWallClock } from "@/lib/bookingAvailability";

export const CONTACT_MESSAGE_SEPARATOR = "\n\n---\n\n";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Client-facing comment (below structured summary) for display and notas de reserva. */
export function contactClientCommentFromRequest(full: string, inquiryDetails: unknown): string {
  const hasStructuredDetails =
    buildInquiryDetailRows(inquiryDetails, { viewer: "technical" }).length > 0;
  const i = full.indexOf(CONTACT_MESSAGE_SEPARATOR);
  if (i === -1) return full.trim();
  if (!hasStructuredDetails) return full.trim();
  const tail = full.slice(i + CONTACT_MESSAGE_SEPARATOR.length).trim();
  return tail.length ? tail : "Sin comentario adicional.";
}

function trimUuid(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return UUID_RE.test(t) ? t : undefined;
}

function safeInquiryTime(inquiryDetails: unknown, key: "eventTimeStart" | "eventTimeEnd"): string {
  if (!inquiryDetails || typeof inquiryDetails !== "object") return "";
  const v = (inquiryDetails as Record<string, unknown>)[key];
  if (typeof v !== "string") return "";
  return /^\d{2}:\d{2}$/.test(v.trim()) ? v.trim() : "";
}

function isoDateFromContactEventDate(eventDate: string | null | undefined): string | null {
  if (!eventDate || typeof eventDate !== "string") return null;
  const head = eventDate.trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(head)) return head;
  const d = new Date(eventDate);
  if (Number.isNaN(d.getTime())) return null;
  const utcHead = d.toISOString().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(utcHead) ? utcHead : null;
}

/**
 * Maps inquiry codes → Service.id (GET /services/admin).
 * Optional `eventTypeContactCodeById`: admin tipos de evento → código de consulta.
 * Optional `inquiryCodeByCatalogLineId`: filas públicas GET `/events/contact-lines` (`id` = Event.id o EventType.id
 * en flujo sin evento) → código; sirve sin depender solo del JWT admin y refleja el mismo catálogo que el cliente.
 */
export function resolveServiceIdForContactRequest(
  row: ContactRequest,
  serviceByInquiryCode: Map<string, string>,
  eventTypeContactCodeById?: Map<string, string>,
  inquiryCodeByCatalogLineId?: Map<string, string>,
  fallbackServiceId?: string,
): string | null {
  const d =
    row.inquiryDetails && typeof row.inquiryDetails === "object" && !Array.isArray(row.inquiryDetails)
      ? (row.inquiryDetails as Record<string, unknown>)
      : null;

  if (d) {
    const kind = d.sourceCatalogKind;
    const catId = typeof d.sourceCatalogId === "string" ? d.sourceCatalogId.trim() : "";
    if (kind === "service" && UUID_RE.test(catId)) return catId;
  }

  const code = row.serviceType?.trim();
  if (code && serviceByInquiryCode.has(code)) return serviceByInquiryCode.get(code)!;

  if (d && eventTypeContactCodeById?.size) {
    const etId = trimUuid(d.eventTypeId);
    if (etId) {
      const etCode = eventTypeContactCodeById.get(etId)?.trim();
      if (etCode && serviceByInquiryCode.has(etCode)) return serviceByInquiryCode.get(etCode)!;
    }
  }

  if (d && inquiryCodeByCatalogLineId?.size) {
    const catalogLineId = trimUuid(d.eventId);
    if (catalogLineId) {
      const lineCode = inquiryCodeByCatalogLineId.get(catalogLineId)?.trim();
      if (lineCode && serviceByInquiryCode.has(lineCode)) return serviceByInquiryCode.get(lineCode)!;
    }
    const typeAsLineId = trimUuid(d.eventTypeId);
    if (typeAsLineId) {
      const lineCode = inquiryCodeByCatalogLineId.get(typeAsLineId)?.trim();
      if (lineCode && serviceByInquiryCode.has(lineCode)) return serviceByInquiryCode.get(lineCode)!;
    }
  }

  if (fallbackServiceId && UUID_RE.test(fallbackServiceId.trim())) {
    return fallbackServiceId.trim();
  }

  return null;
}

export type ContactRequestBookingBuild =
  | { ok: true; payload: CreateAdminBookingPayload }
  | { ok: false; error: string };

/** Builds the admin booking API payload from a saved contact request (same rules as «Agendar»). */
export function buildAdminBookingPayloadFromContactRequest(
  row: ContactRequest,
  serviceByInquiryCode: Map<string, string>,
  bookingTz: string,
  eventTypeContactCodeById?: Map<string, string>,
  inquiryCodeByCatalogLineId?: Map<string, string>,
  fallbackServiceId?: string,
): ContactRequestBookingBuild {
  const serviceId = resolveServiceIdForContactRequest(
    row,
    serviceByInquiryCode,
    eventTypeContactCodeById,
    inquiryCodeByCatalogLineId,
    fallbackServiceId,
  );
  if (!serviceId) {
    return {
      ok: false,
      error:
        "No hay ningún servicio en catálogo con el mismo «código de consulta» que esta petición (o falta en el tipo de evento). En admin → Tipos de servicio del catálogo, asigna un código (p. ej. VIP_EVENT) que coincida con el tipo de evento; o usa «Abrir en Agendar» y elige el servicio a mano.",
    };
  }

  if (!row.fullName?.trim()) return { ok: false, error: "Falta el nombre del cliente." };
  if (!row.email?.trim()) return { ok: false, error: "Falta el email del cliente." };
  const phone = row.phone?.trim();
  if (!phone) return { ok: false, error: "Falta el teléfono; agrégalo en «Agendar» o pídeselo al cliente." };
  if (!row.location?.trim()) return { ok: false, error: "Falta la ubicación del evento." };

  const dateIso = isoDateFromContactEventDate(row.eventDate ?? undefined);
  if (!dateIso) return { ok: false, error: "Falta una fecha de evento válida." };

  const start = safeInquiryTime(row.inquiryDetails, "eventTimeStart");
  const end = safeInquiryTime(row.inquiryDetails, "eventTimeEnd");
  if (!start || !end) {
    return {
      ok: false,
      error: "Faltan hora inicial y hora final del evento en los datos enviados por el cliente.",
    };
  }

  const startM = hhmmToMinutes(start);
  const endM = hhmmToMinutes(end);
  if (startM === null || endM === null) {
    return { ok: false, error: "Las horas indicadas no tienen un formato válido (usa HH:mm)." };
  }
  if (endM <= startM) {
    return { ok: false, error: "La hora final debe ser posterior a la hora inicial." };
  }

  let eventInstant: Date;
  try {
    eventInstant = utcInstantForWallClock(dateIso, startM, bookingTz);
  } catch {
    return { ok: false, error: "No se pudo interpretar la fecha y hora en la zona de reservas." };
  }

  const details =
    row.inquiryDetails && typeof row.inquiryDetails === "object" && !Array.isArray(row.inquiryDetails)
      ? (row.inquiryDetails as Record<string, unknown>)
      : {};

  const eventTypeId = trimUuid(details.eventTypeId);
  const occasionTypeId = trimUuid(details.occasionTypeId);
  const eventId = trimUuid(details.eventId);

  let guestCount: number | undefined;
  if (details.guestCount !== undefined && details.guestCount !== null) {
    const n = Number(details.guestCount);
    if (Number.isFinite(n) && n > 0 && Number.isInteger(n)) guestCount = n;
  }

  const notesRaw = contactClientCommentFromRequest(row.message, row.inquiryDetails);
  const notes = notesRaw.length > 4000 ? notesRaw.slice(0, 4000) : notesRaw;

  const bookingDetails: Record<string, unknown> = { ...details };
  bookingDetails.eventTimeStart = start;
  bookingDetails.eventTimeEnd = end;

  const payload: CreateAdminBookingPayload = {
    serviceId,
    eventDate: eventInstant.toISOString(),
    location: row.location.trim(),
    guestFullName: row.fullName.trim(),
    guestEmail: row.email.trim(),
    guestPhone: phone,
    status: "CONFIRMED",
    source: "ADMIN_FROM_CONTACT",
    notes: notes || undefined,
    ...(guestCount !== undefined ? { guestCount } : {}),
    ...(eventTypeId ? { eventTypeId } : {}),
    ...(occasionTypeId ? { occasionTypeId } : {}),
    ...(eventId ? { eventId } : {}),
    bookingDetails,
  };

  return { ok: true, payload };
}

/** Mapas de catálogo admin para prellenar servicio en «Agendar» (misma lógica que «Reservar»). */
export type AgendarPrefillCatalogMaps = {
  serviceByInquiryCode: Map<string, string>;
  eventTypeContactCodeById?: Map<string, string>;
  inquiryCodeByCatalogLineId?: Map<string, string>;
  fallbackServiceId?: string;
};

/** Query string for «Agendar» cuando hace falta revisar datos antes de guardar. */
export function buildAgendarPrefillHref(row: ContactRequest, catalog?: AgendarPrefillCatalogMaps): string {
  const sp = new URLSearchParams();
  if (row.fullName) sp.set("fullName", row.fullName);
  if (row.email) sp.set("email", row.email);
  if (row.phone) sp.set("phone", row.phone);
  if (row.eventDate) sp.set("eventDate", row.eventDate.slice(0, 10));
  if (row.location) sp.set("location", row.location);
  const start = safeInquiryTime(row.inquiryDetails, "eventTimeStart");
  const end = safeInquiryTime(row.inquiryDetails, "eventTimeEnd");
  if (start) sp.set("start", start);
  if (end) sp.set("end", end);
  const msg = contactClientCommentFromRequest(row.message, row.inquiryDetails);
  if (msg) sp.set("message", msg.slice(0, 500));

  const d =
    row.inquiryDetails && typeof row.inquiryDetails === "object" && !Array.isArray(row.inquiryDetails)
      ? (row.inquiryDetails as Record<string, unknown>)
      : null;

  if (catalog?.serviceByInquiryCode.size) {
    const sid = resolveServiceIdForContactRequest(
      row,
      catalog.serviceByInquiryCode,
      catalog.eventTypeContactCodeById,
      catalog.inquiryCodeByCatalogLineId,
      catalog.fallbackServiceId,
    );
    if (sid) sp.set("serviceId", sid);
  }
  if (d) {
    const etId = trimUuid(d.eventTypeId);
    if (etId) sp.set("eventTypeId", etId);
    const ocId = trimUuid(d.occasionTypeId);
    if (ocId) sp.set("occasionTypeId", ocId);
    if (d.guestCount !== undefined && d.guestCount !== null) {
      const n = Number(d.guestCount);
      if (Number.isFinite(n) && n > 0 && Number.isInteger(n)) sp.set("guestCount", String(Math.round(n)));
    }
  }

  return `/shamell-admin/agenda/agendar?${sp.toString()}`;
}
