/** Aligns with backend CONTACT_INQUIRY_CODES and EventType.contactInquiryCode. */

export const SERVICE_TYPE_CODES = ["PRIVATE_GALA", "VIP_EVENT", "BESPOKE", "GENERAL"] as const;

export type ServiceTypeCode = (typeof SERVICE_TYPE_CODES)[number];

export function isValidInquiryCode(v: string | null): v is ServiceTypeCode {
  return Boolean(v && SERVICE_TYPE_CODES.includes(v as ServiceTypeCode));
}

/** Alias for URL query `serviceType`. */
export function isValidServiceTypeParam(v: string | null): v is ServiceTypeCode {
  return isValidInquiryCode(v);
}

export const INQUIRY_ENTRY_SOURCES = ["contact_page", "home_service_card", "inquire_section"] as const;
export type InquiryEntrySource = (typeof INQUIRY_ENTRY_SOURCES)[number];

export function parseInquiryEntrySource(raw: string | null): InquiryEntrySource | undefined {
  if (!raw) return undefined;
  return INQUIRY_ENTRY_SOURCES.includes(raw as InquiryEntrySource)
    ? (raw as InquiryEntrySource)
    : undefined;
}

/** Prefer DB `contactInquiryCode`; fallback GENERAL. */
export function resolveServiceLineFromCatalog(
  contactInquiryCode: string | null | undefined,
): ServiceTypeCode {
  if (contactInquiryCode && isValidInquiryCode(contactInquiryCode)) return contactInquiryCode;
  return "GENERAL";
}

/** Legacy query param for experience / service cards (not event catalog lines). */
export function buildServiceInquireHref(
  contactInquiryCode: string | null | undefined,
): string {
  const code = resolveServiceLineFromCatalog(contactInquiryCode);
  return `/contacto?serviceType=${code}&entry=home_service_card`;
}

const CATALOG_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isContactCatalogUuid(value: string): boolean {
  return CATALOG_UUID_REGEX.test(value.trim());
}

/** Public catalog row kind for `/contacto?catalogKind=&catalogId=` deep links. */
export const CONTACT_CATALOG_KINDS = ["service", "event"] as const;
export type ContactCatalogKind = (typeof CONTACT_CATALOG_KINDS)[number];

export function parseContactCatalogParams(
  kind: string | null,
  id: string | null,
): { kind: ContactCatalogKind; id: string } | undefined {
  if (!kind || id == null || id === "") return undefined;
  if (!CONTACT_CATALOG_KINDS.includes(kind as ContactCatalogKind)) return undefined;
  const tid = id.trim();
  if (!isContactCatalogUuid(tid)) return undefined;
  return { kind: kind as ContactCatalogKind, id: tid };
}

export function appendCatalogToContactHref(
  baseHref: string,
  kind: ContactCatalogKind,
  catalogId: string,
): string {
  const tid = catalogId.trim();
  if (!tid || !isContactCatalogUuid(tid)) return baseHref;
  const sep = baseHref.includes("?") ? "&" : "?";
  return `${baseHref}${sep}catalogKind=${kind}&catalogId=${encodeURIComponent(tid)}`;
}

/** Deep link for event cards: eventId + catalog params for context banner. */
export function buildEventLineContactHref(eventId: string): string {
  const tid = eventId.trim();
  if (!isContactCatalogUuid(tid)) return "/contacto?entry=home_service_card";
  const base = `/contacto?eventId=${encodeURIComponent(tid)}&entry=home_service_card`;
  return appendCatalogToContactHref(base, "event", tid);
}

export const EXPERIENCE_ADDON_OPTIONS: {
  value: "FIRE" | "VEIL_FAN_LED" | "SWORD_CANDELABRA";
  label: string;
  note?: string;
}[] = [
  {
    value: "FIRE",
    label: "Fire performance",
    note: "Subject to venue safety and regulations.",
  },
  {
    value: "VEIL_FAN_LED",
    label: "Veil, fan & LED wings",
    note: "Colors tailored to your event.",
  },
  {
    value: "SWORD_CANDELABRA",
    label: "Sword & candelabra (shamadan)",
    note: "Adds USD 150 to a standard performance.",
  },
];

/** Labels for admin inquiry-code select on event types. */
export const ADMIN_INQUIRY_CODE_OPTIONS: { value: ServiceTypeCode | ""; label: string }[] = [
  { value: "", label: "None — GENERAL in the form when no code is set" },
  { value: "PRIVATE_GALA", label: "PRIVATE_GALA — Private gala / social events" },
  { value: "VIP_EVENT", label: "VIP_EVENT — VIP events" },
  { value: "BESPOKE", label: "BESPOKE — Bespoke collaborations" },
  { value: "GENERAL", label: "GENERAL — General inquiry" },
];
