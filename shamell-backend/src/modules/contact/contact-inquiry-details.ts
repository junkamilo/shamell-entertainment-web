import { BadRequestException } from '@nestjs/common';

export const EXPERIENCE_ADDONS = [
  'FIRE',
  'VEIL_FAN_LED',
  'SWORD_CANDELABRA',
] as const;
export type ExperienceAddonCode = (typeof EXPERIENCE_ADDONS)[number];

export const INQUIRY_ENTRY_SOURCES = [
  'contact_page',
  'home_service_card',
  'inquire_section',
  'concierge_gate',
] as const;
export type InquiryEntrySource = (typeof INQUIRY_ENTRY_SOURCES)[number];

/** Public booking-inquiry wizard (`ContactInquiryForm`); excludes concierge-only flow. */
export const BOOKING_INQUIRY_ENTRY_SOURCES = INQUIRY_ENTRY_SOURCES.filter(
  (s): s is Exclude<InquiryEntrySource, 'concierge_gate'> => s !== 'concierge_gate',
);

export const SOURCE_CATALOG_KINDS = ['service', 'event'] as const;
export type SourceCatalogKind = (typeof SOURCE_CATALOG_KINDS)[number];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SanitizedInquiryDetails = {
  entrySource?: InquiryEntrySource;
  /** Legacy static occasion codes (older inquiries). */
  occasionCode?: string;
  occasionOther?: string;
  eventId?: string;
  eventTypeId?: string;
  occasionTypeId?: string;
  occasionTypeIdsProject?: string[];
  occasionTypeIdsRole?: string[];
  bespokeProjectTypes?: string[];
  bespokeRoles?: string[];
  projectDeadlineNote?: string;
  experienceAddons?: ExperienceAddonCode[];
  eventTimeStart?: string;
  eventTimeEnd?: string;
  guestCount?: number;
  /** Street / venue address line from public booking form (city may still be in top-level `location`). */
  eventAddress?: string;
  /** Admin Book form: multiple catalog service row ids (order = selection); first must match booking.serviceId. */
  serviceIds?: string[];
  /** Server-enriched service type names (same order as `serviceIds`). */
  serviceLabels?: string[];
  venueIndoor?: boolean | null;
  conciergeIntent?: string;
  planningStage?: string;
  occasionHint?: string;
  visionSummary?: string;
  sourceCatalogKind?: SourceCatalogKind;
  sourceCatalogId?: string;
  sourceCatalogTitle?: string;
  /** Populated server-side before persistence / summary. */
  occasionSingleLabel?: string;
  eventTypeLabel?: string;
  bespokeProjectLabels?: string[];
  bespokeRoleLabels?: string[];
};

const MAX_STR = 200;
const MAX_NOTE = 500;
const MAX_ARRAY_LEN = 24;
const MAX_ITEM_LEN = 120;
const MAX_CATALOG_TITLE = 120;
const MAX_EVENT_ADDRESS = 400;
const MAX_UUID_ARRAY = 24;
const MAX_VISION_SUMMARY = 1000;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function trimString(v: unknown, max: number): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  if (!t) return undefined;
  return t.length > max ? t.slice(0, max) : t;
}

function trimStringArray(
  v: unknown,
  maxItems: number,
  maxItemLen: number,
): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: string[] = [];
  for (const item of v.slice(0, maxItems)) {
    if (typeof item !== 'string') continue;
    const t = item.trim();
    if (!t) continue;
    out.push(t.length > maxItemLen ? t.slice(0, maxItemLen) : t);
  }
  return out.length ? out : undefined;
}

function trimUuid(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  if (!t || !UUID_REGEX.test(t)) return undefined;
  return t;
}

function trimUuidArray(v: unknown, maxItems: number): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of v.slice(0, maxItems)) {
    const id = trimUuid(item);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out.length ? out : undefined;
}

/** Validates and shrinks client-provided inquiryDetails; returns undefined if absent or empty after trim. */
export function sanitizeInquiryDetails(
  raw: unknown,
): SanitizedInquiryDetails | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (!isPlainObject(raw)) {
    throw new BadRequestException('inquiryDetails must be an object.');
  }

  const keys = Object.keys(raw);
  if (keys.length > 40) {
    throw new BadRequestException('inquiryDetails has too many keys.');
  }

  const out: SanitizedInquiryDetails = {};

  const entrySource = trimString(raw.entrySource, 40);
  if (entrySource) {
    if (!INQUIRY_ENTRY_SOURCES.includes(entrySource as InquiryEntrySource)) {
      throw new BadRequestException('Invalid inquiryDetails.entrySource.');
    }
    out.entrySource = entrySource as InquiryEntrySource;
  }

  const occasionCode = trimString(raw.occasionCode, MAX_STR);
  if (occasionCode) out.occasionCode = occasionCode;

  const occasionOther = trimString(raw.occasionOther, MAX_NOTE);
  if (occasionOther) out.occasionOther = occasionOther;

  const eventId = trimUuid(raw.eventId);
  if (eventId) out.eventId = eventId;

  const eventTypeId = trimUuid(raw.eventTypeId);
  if (eventTypeId) out.eventTypeId = eventTypeId;

  const occasionTypeId = trimUuid(raw.occasionTypeId);
  if (occasionTypeId) out.occasionTypeId = occasionTypeId;

  const occasionTypeIdsProject = trimUuidArray(
    raw.occasionTypeIdsProject,
    MAX_UUID_ARRAY,
  );
  if (occasionTypeIdsProject)
    out.occasionTypeIdsProject = occasionTypeIdsProject;

  const occasionTypeIdsRole = trimUuidArray(
    raw.occasionTypeIdsRole,
    MAX_UUID_ARRAY,
  );
  if (occasionTypeIdsRole) out.occasionTypeIdsRole = occasionTypeIdsRole;

  const bespokeProjectTypes = trimStringArray(
    raw.bespokeProjectTypes,
    MAX_ARRAY_LEN,
    MAX_ITEM_LEN,
  );
  if (bespokeProjectTypes) out.bespokeProjectTypes = bespokeProjectTypes;

  const bespokeRoles = trimStringArray(
    raw.bespokeRoles,
    MAX_ARRAY_LEN,
    MAX_ITEM_LEN,
  );
  if (bespokeRoles) out.bespokeRoles = bespokeRoles;

  const projectDeadlineNote = trimString(raw.projectDeadlineNote, MAX_NOTE);
  if (projectDeadlineNote) out.projectDeadlineNote = projectDeadlineNote;

  if (raw.experienceAddons !== undefined) {
    if (!Array.isArray(raw.experienceAddons)) {
      throw new BadRequestException(
        'inquiryDetails.experienceAddons must be an array.',
      );
    }
    const addons: ExperienceAddonCode[] = [];
    for (const a of raw.experienceAddons.slice(0, 8)) {
      if (
        typeof a !== 'string' ||
        !EXPERIENCE_ADDONS.includes(a as ExperienceAddonCode)
      ) {
        throw new BadRequestException('Invalid experienceAddons value.');
      }
      if (!addons.includes(a as ExperienceAddonCode))
        addons.push(a as ExperienceAddonCode);
    }
    if (addons.length) out.experienceAddons = addons;
  }

  const eventTimeStart = trimString(raw.eventTimeStart, 24);
  if (eventTimeStart) out.eventTimeStart = eventTimeStart;

  const eventTimeEnd = trimString(raw.eventTimeEnd, 24);
  if (eventTimeEnd) out.eventTimeEnd = eventTimeEnd;

  const serviceIds = trimUuidArray(raw.serviceIds, MAX_UUID_ARRAY);
  if (serviceIds) out.serviceIds = serviceIds;

  const serviceLabels = trimStringArray(
    raw.serviceLabels,
    MAX_UUID_ARRAY,
    MAX_ITEM_LEN,
  );
  if (serviceLabels) out.serviceLabels = serviceLabels;

  if (raw.guestCount !== undefined && raw.guestCount !== null) {
    const n = Number(raw.guestCount);
    if (!Number.isFinite(n) || n < 0 || n > 100_000 || !Number.isInteger(n)) {
      throw new BadRequestException('Invalid inquiryDetails.guestCount.');
    }
    if (n > 0) out.guestCount = n;
  }

  const eventAddress = trimString(raw.eventAddress, MAX_EVENT_ADDRESS);
  if (eventAddress) out.eventAddress = eventAddress;

  if (raw.venueIndoor !== undefined && raw.venueIndoor !== null) {
    if (typeof raw.venueIndoor !== 'boolean') {
      throw new BadRequestException(
        'inquiryDetails.venueIndoor must be a boolean.',
      );
    }
    out.venueIndoor = raw.venueIndoor;
  }

  const conciergeIntent = trimString(raw.conciergeIntent, MAX_STR);
  if (conciergeIntent) out.conciergeIntent = conciergeIntent;

  const planningStage = trimString(raw.planningStage, MAX_STR);
  if (planningStage) out.planningStage = planningStage;

  const occasionHint = trimString(raw.occasionHint, MAX_NOTE);
  if (occasionHint) out.occasionHint = occasionHint;

  const visionSummary = trimString(raw.visionSummary, MAX_VISION_SUMMARY);
  if (visionSummary) out.visionSummary = visionSummary;

  const hasCatalogHint =
    raw.sourceCatalogKind !== undefined ||
    raw.sourceCatalogId !== undefined ||
    raw.sourceCatalogTitle !== undefined;
  if (hasCatalogHint) {
    if (
      typeof raw.sourceCatalogKind !== 'string' ||
      !SOURCE_CATALOG_KINDS.includes(raw.sourceCatalogKind as SourceCatalogKind)
    ) {
      throw new BadRequestException(
        'Invalid inquiryDetails.sourceCatalogKind.',
      );
    }
    if (
      typeof raw.sourceCatalogId !== 'string' ||
      !UUID_REGEX.test(raw.sourceCatalogId.trim())
    ) {
      throw new BadRequestException('Invalid inquiryDetails.sourceCatalogId.');
    }
    const title = trimString(raw.sourceCatalogTitle, MAX_CATALOG_TITLE);
    if (!title || title.length < 1) {
      throw new BadRequestException(
        'inquiryDetails.sourceCatalogTitle is required with catalog context.',
      );
    }
    out.sourceCatalogKind = raw.sourceCatalogKind as SourceCatalogKind;
    out.sourceCatalogId = raw.sourceCatalogId.trim();
    out.sourceCatalogTitle = title;
  }

  if (Object.keys(out).length === 0) return undefined;
  return out;
}

export function formatInquiryDetailsSummary(
  details: SanitizedInquiryDetails,
  serviceType?: string,
): string {
  const lines: string[] = [];
  if (serviceType) lines.push(`Service line: ${serviceType}`);
  if (details.sourceCatalogKind && details.sourceCatalogId) {
    const t = details.sourceCatalogTitle
      ? ` — ${details.sourceCatalogTitle}`
      : '';
    lines.push(
      `Catalog: ${details.sourceCatalogKind} ${details.sourceCatalogId}${t}`,
    );
  }
  if (details.entrySource) lines.push(`Entry: ${details.entrySource}`);
  if (details.eventId) lines.push(`Event: ${details.eventId}`);
  if (details.eventTypeLabel)
    lines.push(`Event type: ${details.eventTypeLabel}`);
  else if (details.eventTypeId)
    lines.push(`Event type id: ${details.eventTypeId}`);
  if (details.occasionCode)
    lines.push(`Occasion (legacy code): ${details.occasionCode}`);
  if (details.occasionSingleLabel)
    lines.push(`Occasion: ${details.occasionSingleLabel}`);
  else if (details.occasionTypeId)
    lines.push(`Occasion type id: ${details.occasionTypeId}`);
  if (details.occasionOther)
    lines.push(`Occasion (other): ${details.occasionOther}`);
  if (details.bespokeProjectTypes?.length) {
    lines.push(`Project types: ${details.bespokeProjectTypes.join(', ')}`);
  }
  if (details.bespokeRoles?.length) {
    lines.push(`Collaboration roles: ${details.bespokeRoles.join(', ')}`);
  }
  if (details.bespokeProjectLabels?.length) {
    lines.push(`Bespoke projects: ${details.bespokeProjectLabels.join(', ')}`);
  } else if (details.occasionTypeIdsProject?.length) {
    lines.push(
      `Bespoke projects (ids): ${details.occasionTypeIdsProject.join(', ')}`,
    );
  }
  if (details.bespokeRoleLabels?.length) {
    lines.push(`Bespoke roles: ${details.bespokeRoleLabels.join(', ')}`);
  } else if (details.occasionTypeIdsRole?.length) {
    lines.push(
      `Bespoke roles (ids): ${details.occasionTypeIdsRole.join(', ')}`,
    );
  }
  if (details.projectDeadlineNote)
    lines.push(`Deadline / window: ${details.projectDeadlineNote}`);
  if (details.experienceAddons?.length) {
    lines.push(`Experience add-ons: ${details.experienceAddons.join(', ')}`);
  }
  if (details.eventTimeStart || details.eventTimeEnd) {
    lines.push(
      `Time: ${details.eventTimeStart ?? '?'} – ${details.eventTimeEnd ?? '?'}`,
    );
  }
  if (details.serviceLabels?.length) {
    lines.push(`Services: ${details.serviceLabels.join(', ')}`);
  } else if (details.serviceIds?.length) {
    lines.push(`Service ids: ${details.serviceIds.join(', ')}`);
  }
  if (details.guestCount != null)
    lines.push(`Guests (approx.): ${details.guestCount}`);
  if (details.eventAddress)
    lines.push(`Event address: ${details.eventAddress}`);
  if (details.venueIndoor === true) lines.push('Venue: indoor');
  if (details.venueIndoor === false) lines.push('Venue: outdoor');
  if (details.conciergeIntent)
    lines.push(`Concierge intent: ${details.conciergeIntent}`);
  if (details.planningStage)
    lines.push(`Planning stage: ${details.planningStage}`);
  if (details.occasionHint)
    lines.push(`Occasion idea: ${details.occasionHint}`);
  if (details.visionSummary)
    lines.push(`Vision summary: ${details.visionSummary}`);
  return lines.join('\n');
}
