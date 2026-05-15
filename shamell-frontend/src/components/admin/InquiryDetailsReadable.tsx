import { EXPERIENCE_ADDON_OPTIONS, SERVICE_TYPE_CODES, type ServiceTypeCode } from "@/lib/contactInquiryConstants";

function titleCaseLoose(s: string): string {
  return s
    .replace(/_/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Service line (`serviceType` on contact), labels for admin UI. */
export function formatAdminServiceType(code: string | null | undefined): string {
  if (!code?.trim()) return "";
  const c = code.trim();
  const labels: Record<ServiceTypeCode, string> = {
    PRIVATE_GALA: "Private gala / social events",
    VIP_EVENT: "VIP events",
    BESPOKE: "Bespoke collaborations",
    GENERAL: "General inquiry",
  };
  if (SERVICE_TYPE_CODES.includes(c as ServiceTypeCode)) {
    return labels[c as ServiceTypeCode];
  }
  return titleCaseLoose(c);
}

const ENTRY_SOURCE_LABELS: Record<string, string> = {
  contact_page: "Contact page",
  home_service_card: "Card from home",
  inquire_section: "Inquire block on site",
  concierge_gate: "Concierge gate",
};

const CONCIERGE_INTENT_LABELS: Record<string, string> = {
  needs_guidance: "Client needs guidance",
};

const PLANNING_STAGE_LABELS: Record<string, string> = {
  EARLY_IDEA: "Early idea, needs direction",
  COMPARING_OPTIONS: "Comparing possible experiences",
  DATE_OR_VENUE_READY: "Date or venue in mind",
  JUST_EXPLORING: "Exploring what Shamell offers",
};

/** Legacy occasion codes (before UUID occasion types). */
const OCCASION_LEGACY_LABELS: Record<string, string> = {
  LUXURY_BIRTHDAY: "Luxury birthday",
  ANNIVERSARY: "Anniversary",
  ENGAGEMENT_PARTY: "Engagement party",
  PRIVATE_VILLA: "Private villa gathering",
  YACHT: "Yacht party",
  INTIMATE_DINNER: "Intimate dinner",
  HOME_EVENT: "Home celebration",
  HOLIDAY: "Holiday / season",
  EXCLUSIVE_SOCIAL: "Exclusive social evening",
  WEDDING: "Wedding",
  CORPORATE_VIP: "Corporate VIP",
  OTHER: "Other (see description)",
};

function labelLegacyOccasion(code: string): string {
  return OCCASION_LEGACY_LABELS[code] ?? titleCaseLoose(code);
}

function labelEntrySource(code: string): string {
  return ENTRY_SOURCE_LABELS[code] ?? titleCaseLoose(code);
}

function labelConciergeIntent(code: string): string {
  return CONCIERGE_INTENT_LABELS[code] ?? titleCaseLoose(code);
}

function labelPlanningStage(code: string): string {
  return PLANNING_STAGE_LABELS[code] ?? titleCaseLoose(code);
}

const EXPERIENCE_ADDON_LABELS: Record<string, string> = {
  FIRE: "Fire performance",
  VEIL_FAN_LED: "Veil, fan & LED wings",
  SWORD_CANDELABRA: "Sword & candelabra (shamadan)",
};

function labelExperienceAddon(code: string): string {
  return (
    EXPERIENCE_ADDON_LABELS[code] ??
    EXPERIENCE_ADDON_OPTIONS.find((o) => o.value === code)?.label ??
    titleCaseLoose(code)
  );
}

function stringArrayField(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim());
}

export type InquiryDetailRow = { label: string; value: string };

export type InquiryDetailViewer = "admin" | "technical";

export type BuildInquiryDetailRowsOptions = {
  viewer?: InquiryDetailViewer;
};

const KNOWN_KEYS = new Set([
  "entrySource",
  "occasionCode",
  "occasionOther",
  "eventId",
  "eventTypeId",
  "eventTypeLabel",
  "occasionTypeId",
  "occasionSingleLabel",
  "occasionTypeIdsProject",
  "occasionTypeIdsRole",
  "bespokeProjectLabels",
  "bespokeRoleLabels",
  "bespokeProjectTypes",
  "bespokeRoles",
  "projectDeadlineNote",
  "experienceAddons",
  "eventTimeStart",
  "eventTimeEnd",
  "guestCount",
  "eventAddress",
  "venueIndoor",
  "conciergeIntent",
  "planningStage",
  "occasionHint",
  "visionSummary",
  "sourceCatalogKind",
  "sourceCatalogId",
  "sourceCatalogTitle",
  "serviceIds",
  "serviceLabels",
  "guideInvestmentTotalUsd",
  "guideInvestmentIsPartial",
]);

/**
 * Turns stored `inquiryDetails` into labeled rows.
 * `viewer: "admin"` (default): hides raw origin, UUIDs, and id-only rows for human reading.
 */
export function buildInquiryDetailRows(
  details: unknown,
  opts?: BuildInquiryDetailRowsOptions,
): InquiryDetailRow[] {
  if (details === null || details === undefined) return [];
  if (typeof details !== "object" || Array.isArray(details)) return [];

  const admin = (opts?.viewer ?? "admin") === "admin";
  const d = details as Record<string, unknown>;
  const rows: InquiryDetailRow[] = [];

  const push = (label: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && !value.trim()) return;
    const v =
      typeof value === "boolean"
        ? value
          ? "Yes"
          : "No"
        : typeof value === "number"
          ? String(value)
          : String(value).trim();
    if (!v) return;
    rows.push({ label, value: v });
  };

  if (d.entrySource === "concierge_gate") {
    push("Request type", "Concierge guidance");
  } else if (!admin && typeof d.entrySource === "string") {
    push("Form entry source", labelEntrySource(d.entrySource));
  }

  if (typeof d.conciergeIntent === "string") {
    push("Concierge request", labelConciergeIntent(d.conciergeIntent));
  }
  if (typeof d.planningStage === "string") {
    push("Planning stage", labelPlanningStage(d.planningStage));
  }
  if (typeof d.occasionHint === "string") {
    push("Occasion idea", d.occasionHint);
  }
  if (typeof d.visionSummary === "string") {
    push("Vision summary", d.visionSummary);
  }

  if (d.sourceCatalogKind === "service" || d.sourceCatalogKind === "event") {
    const title = typeof d.sourceCatalogTitle === "string" ? d.sourceCatalogTitle.trim() : "";
    const label =
      d.sourceCatalogKind === "service" ? "Service selected on site" : "Event selected on site";
    if (title) push(label, title);
  }

  if (!admin && typeof d.eventId === "string") push("Event (id)", d.eventId);
  if (typeof d.eventTypeLabel === "string") push("Event type", d.eventTypeLabel);
  else if (!admin && typeof d.eventTypeId === "string") push("Event type (id)", d.eventTypeId);

  if (typeof d.occasionSingleLabel === "string") push("Occasion type", d.occasionSingleLabel);
  else if (!admin && typeof d.occasionTypeId === "string") push("Occasion type (id)", d.occasionTypeId);

  if (typeof d.occasionCode === "string") {
    push("Occasion type (legacy code)", labelLegacyOccasion(d.occasionCode));
  }
  if (typeof d.occasionOther === "string") {
    push("Occasion (free text)", d.occasionOther);
  }

  const bespokeProjectLabels = stringArrayField(d.bespokeProjectLabels);
  if (bespokeProjectLabels.length) {
    push("Bespoke projects", bespokeProjectLabels.join(" · "));
  } else {
    const projects = stringArrayField(d.bespokeProjectTypes);
    if (projects.length) push("Project type (legacy)", projects.map(titleCaseLoose).join(" · "));
    if (!admin) {
      const ids = stringArrayField(d.occasionTypeIdsProject);
      if (ids.length) push("Bespoke projects (ids)", ids.join(", "));
    }
  }

  const bespokeRoleLabels = stringArrayField(d.bespokeRoleLabels);
  if (bespokeRoleLabels.length) {
    push("Roles / collaboration", bespokeRoleLabels.join(" · "));
  } else {
    const roles = stringArrayField(d.bespokeRoles);
    if (roles.length) push("Role / collaboration (legacy)", roles.map(titleCaseLoose).join(" · "));
    if (!admin) {
      const ids = stringArrayField(d.occasionTypeIdsRole);
      if (ids.length) push("Bespoke roles (ids)", ids.join(", "));
    }
  }

  if (typeof d.projectDeadlineNote === "string") {
    push("Timeline or window", d.projectDeadlineNote);
  }

  const addons = stringArrayField(d.experienceAddons);
  if (addons.length) {
    push("Experience add-ons", addons.map(labelExperienceAddon).join(" · "));
  }

  const serviceLabels = stringArrayField(d.serviceLabels);
  if (serviceLabels.length) {
    push("Services selected", serviceLabels.join(" · "));
  } else if (!admin) {
    const serviceIds = stringArrayField(d.serviceIds);
    if (serviceIds.length) push("Service ids", serviceIds.join(", "));
  }

  if (d.guideInvestmentTotalUsd !== undefined && d.guideInvestmentTotalUsd !== null) {
    const n = Number(d.guideInvestmentTotalUsd);
    if (Number.isFinite(n) && n >= 0) {
      push("Guide investment (USD)", `$${Math.round(n).toLocaleString("en-US")}`);
    }
  }
  if (d.guideInvestmentIsPartial === true) {
    push("Guide estimate", "Partial (catalog incomplete)");
  }

  const start = typeof d.eventTimeStart === "string" ? d.eventTimeStart.trim() : "";
  const end = typeof d.eventTimeEnd === "string" ? d.eventTimeEnd.trim() : "";
  if (start || end) {
    push("Requested time", `${start || "—"} – ${end || "—"}`);
  }

  if (typeof d.guestCount === "number" && Number.isFinite(d.guestCount) && d.guestCount >= 0) {
    push("Guests (approx.)", String(Math.round(d.guestCount)));
  }

  if (typeof d.eventAddress === "string") push("Event address", d.eventAddress);

  if (d.venueIndoor === true) push("Venue", "Indoor");
  else if (d.venueIndoor === false) push("Venue", "Outdoor");

  for (const key of Object.keys(d)) {
    if (KNOWN_KEYS.has(key)) continue;
    const val = d[key];
    if (val === undefined || val === null) continue;
    if (typeof val === "object") {
      try {
        push(titleCaseLoose(key), JSON.stringify(val));
      } catch {
        push(titleCaseLoose(key), String(val));
      }
    } else {
      push(titleCaseLoose(key), val);
    }
  }

  return rows;
}

export function InquiryDetailsReadable({
  details,
  rows: rowsProp,
  viewer = "admin",
}: {
  details?: unknown;
  rows?: InquiryDetailRow[];
  viewer?: InquiryDetailViewer;
}) {
  const rows = rowsProp ?? buildInquiryDetailRows(details, { viewer });
  if (rows.length === 0) return null;

  return (
    <div className="shamell-glass-surface rounded-xl p-4">
      <p className="mb-3 font-brand text-[10px] tracking-[0.18em] text-gold/75">FORM DETAILS</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map(({ label, value }, idx) => (
          <div key={idx} className="min-w-0 sm:col-span-1">
            <dt className="font-brand text-[9px] tracking-widest text-gold/55">{label}</dt>
            <dd className="mt-1 wrap-break-word font-body text-sm leading-snug text-foreground/85">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
