import type { ContactRequest } from "@/hooks/use-admin-contact-requests";
import type { AdminBookingRow, CreateAdminBookingPayload } from "@/hooks/use-admin-bookings";
import { buildInquiryDetailRows, type InquiryDetailRow } from "@/components/admin/InquiryDetailsReadable";
import { bookingServiceDisplayLine } from "@/lib/adminBookingDisplay";
import { hhmmToMinutes } from "@/components/contact/contactLogisticsUtils";
import { utcInstantForWallClock } from "@/lib/bookingAvailability";

export const CONTACT_MESSAGE_SEPARATOR = "\n\n---\n\n";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** JSON snapshot for inbox FORM DETAILS (contact row, booking row, or linked contact). */
export function structuredDetailsForPeticionRow(
  contact: ContactRequest | null,
  booking: AdminBookingRow | null,
  linkedContact?: ContactRequest | null,
): unknown {
  if (contact?.inquiryDetails) return contact.inquiryDetails;
  if (
    booking?.bookingDetails &&
    typeof booking.bookingDetails === "object" &&
    !Array.isArray(booking.bookingDetails) &&
    Object.keys(booking.bookingDetails).length > 0
  ) {
    return booking.bookingDetails;
  }
  if (linkedContact?.inquiryDetails) return linkedContact.inquiryDetails;
  return null;
}

export function eventAddressFromInquiryDetails(details: unknown): string | undefined {
  if (!details || typeof details !== "object" || Array.isArray(details)) return undefined;
  const v = (details as Record<string, unknown>).eventAddress;
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length > 0 ? t : undefined;
}

/** Relational fallback when a booking has no `bookingDetails` snapshot (legacy / manual Agendar). */
export function buildLegacyBookingInquiryRows(
  booking: AdminBookingRow,
  bookingTz: string,
): InquiryDetailRow[] {
  const rows: InquiryDetailRow[] = [];
  const serviceLine = bookingServiceDisplayLine(booking);
  if (serviceLine) rows.push({ label: "Service", value: serviceLine });
  if (booking.eventType?.name) rows.push({ label: "Event type", value: booking.eventType.name });
  if (booking.occasionType?.name) rows.push({ label: "Occasion type", value: booking.occasionType.name });
  if (booking.event?.name) rows.push({ label: "Event", value: booking.event.name });

  const details =
    booking.bookingDetails && typeof booking.bookingDetails === "object" && !Array.isArray(booking.bookingDetails)
      ? (booking.bookingDetails as Record<string, unknown>)
      : null;
  const start =
    typeof details?.eventTimeStart === "string" && /^\d{2}:\d{2}$/.test(details.eventTimeStart.trim())
      ? details.eventTimeStart.trim()
      : "";
  const end =
    typeof details?.eventTimeEnd === "string" && /^\d{2}:\d{2}$/.test(details.eventTimeEnd.trim())
      ? details.eventTimeEnd.trim()
      : "";
  if (start || end) {
    rows.push({ label: "Requested time", value: `${start || "—"} – ${end || "—"}` });
  } else if (booking.eventDate) {
    const wall = new Intl.DateTimeFormat("en-US", {
      timeZone: bookingTz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date(booking.eventDate));
    const hour = wall.find((p) => p.type === "hour")?.value ?? "00";
    const minute = wall.find((p) => p.type === "minute")?.value ?? "00";
    rows.push({ label: "Requested time", value: `${hour}:${minute}` });
  }

  if (booking.guestCount != null && booking.guestCount > 0) {
    rows.push({ label: "Guests (approx.)", value: String(Math.round(booking.guestCount)) });
  }

  return rows;
}

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

/** Valid service UUIDs from `inquiryDetails.serviceIds` (order preserved, deduped). */
export function parseInquiryServiceIds(inquiryDetails: unknown): string[] {
  if (!inquiryDetails || typeof inquiryDetails !== "object" || Array.isArray(inquiryDetails)) {
    return [];
  }
  const raw = (inquiryDetails as Record<string, unknown>).serviceIds;
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const id = trimUuid(item);
    if (id && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
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
  const inquiryServiceIds = parseInquiryServiceIds(row.inquiryDetails);
  const serviceId =
    inquiryServiceIds[0] ??
    resolveServiceIdForContactRequest(
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
  if (inquiryServiceIds.length > 0) {
    bookingDetails.serviceIds = inquiryServiceIds;
  } else {
    // Drop stale/non-UUID serviceIds from stored inquiryDetails so top-level serviceId
    // (catalog resolution) does not fail backend order validation in production.
    delete bookingDetails.serviceIds;
  }

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

  const inquiryServiceIds = parseInquiryServiceIds(row.inquiryDetails);
  if (inquiryServiceIds.length > 0) {
    sp.set("serviceId", inquiryServiceIds[0]);
    sp.set("serviceIds", inquiryServiceIds.join(","));
  } else if (catalog?.serviceByInquiryCode.size) {
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

/**
 * Same prefill as {@link buildAgendarPrefillHref} plus `origin=contact`, `contactId`, and `returnTo`
 * so Book can persist `contactRequestId` and the contact leaves the Guidance lane after booking.
 */
export function buildContactInboxAgendarHref(
  row: ContactRequest,
  catalog: AgendarPrefillCatalogMaps,
  options?: { returnTo?: string },
): string {
  const href = buildAgendarPrefillHref(row, catalog);
  const url = new URL(href, "http://localhost");
  url.searchParams.set("origin", "contact");
  url.searchParams.set("contactId", row.id);
  url.searchParams.set(
    "returnTo",
    (options?.returnTo ?? "/shamell-admin/agenda/peticiones").trim() || "/shamell-admin/agenda/peticiones",
  );
  return `${url.pathname}?${url.searchParams.toString()}`;
}
