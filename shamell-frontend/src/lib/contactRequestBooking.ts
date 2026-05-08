import type { ContactRequest } from "@/hooks/use-admin-contact-requests";
import type { CreateAdminBookingPayload } from "@/hooks/use-admin-bookings";
import { buildInquiryDetailRows } from "@/components/admin/InquiryDetailsReadable";
import { hhmmToMinutes } from "@/components/contact/contactLogisticsUtils";
import { utcInstantForWallClock } from "@/lib/bookingAvailability";

export const CONTACT_MESSAGE_SEPARATOR = "\n\n---\n\n";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Client-facing comment (below structured summary) for display and booking notes. */
export function contactClientCommentFromRequest(full: string, inquiryDetails: unknown): string {
  const hasStructuredDetails =
    buildInquiryDetailRows(inquiryDetails, { viewer: "technical" }).length > 0;
  const i = full.indexOf(CONTACT_MESSAGE_SEPARATOR);
  if (i === -1) return full.trim();
  if (!hasStructuredDetails) return full.trim();
  const tail = full.slice(i + CONTACT_MESSAGE_SEPARATOR.length).trim();
  return tail.length ? tail : "No additional comment.";
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
 * Optional `eventTypeContactCodeById`: admin event type → inquiry code.
 * Optional `inquiryCodeByCatalogLineId`: public rows from GET `/events/contact-lines` (`id` = Event.id or EventType.id
 * in flows without a standalone event) → code; works without relying only on the admin JWT and mirrors the client catalog.
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

/** Builds the admin booking API payload from a saved contact request (same rules as Schedule booking). */
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
        "No catalog service matches this inquiry's contact code (or the event type is missing it). In admin → catalog service types, assign a code (e.g. VIP_EVENT) that matches the event type; or use Open in Schedule and pick the service manually.",
    };
  }

  if (!row.fullName?.trim()) return { ok: false, error: "Client name is missing." };
  if (!row.email?.trim()) return { ok: false, error: "Client email is missing." };
  const phone = row.phone?.trim();
  if (!phone) return { ok: false, error: "Phone is missing; add it in Schedule booking or ask the client." };
  if (!row.location?.trim()) return { ok: false, error: "Event location is missing." };

  const dateIso = isoDateFromContactEventDate(row.eventDate ?? undefined);
  if (!dateIso) return { ok: false, error: "A valid event date is required." };

  const start = safeInquiryTime(row.inquiryDetails, "eventTimeStart");
  const end = safeInquiryTime(row.inquiryDetails, "eventTimeEnd");
  if (!start || !end) {
    return {
      ok: false,
      error: "Event start and end times are missing from the data the client submitted.",
    };
  }

  const startM = hhmmToMinutes(start);
  const endM = hhmmToMinutes(end);
  if (startM === null || endM === null) {
    return { ok: false, error: "The times are not in a valid format (use HH:mm)." };
  }
  if (endM <= startM) {
    return { ok: false, error: "End time must be after start time." };
  }

  let eventInstant: Date;
  try {
    eventInstant = utcInstantForWallClock(dateIso, startM, bookingTz);
  } catch {
    return { ok: false, error: "Could not interpret the date and time in the booking time zone." };
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

/** Admin catalog maps to prefill service in Schedule booking (same logic as Reserve). */
export type AgendarPrefillCatalogMaps = {
  serviceByInquiryCode: Map<string, string>;
  eventTypeContactCodeById?: Map<string, string>;
  inquiryCodeByCatalogLineId?: Map<string, string>;
  fallbackServiceId?: string;
};

/** Query string for Schedule booking when data needs review before saving. */
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
