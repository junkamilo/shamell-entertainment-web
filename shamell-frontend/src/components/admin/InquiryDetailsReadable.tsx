import { EXPERIENCE_ADDON_OPTIONS, SERVICE_TYPE_CODES, type ServiceTypeCode } from "@/lib/contactInquiryConstants";

function titleCaseLoose(s: string): string {
  return s
    .replace(/_/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Línea de servicio (campo `serviceType` del contacto), en español para admin. */
export function formatAdminServiceType(code: string | null | undefined): string {
  if (!code?.trim()) return "";
  const c = code.trim();
  const ES: Record<ServiceTypeCode, string> = {
    PRIVATE_GALA: "Gala privada / eventos sociales",
    VIP_EVENT: "Eventos VIP",
    BESPOKE: "Colaboraciones a medida",
    GENERAL: "Consulta general",
  };
  if (SERVICE_TYPE_CODES.includes(c as ServiceTypeCode)) {
    return ES[c as ServiceTypeCode];
  }
  return titleCaseLoose(c);
}

const ENTRY_SOURCE_ES: Record<string, string> = {
  contact_page: "Página de contacto",
  home_service_card: "Tarjeta desde el inicio",
  inquire_section: "Bloque de consulta en la web",
};

/** Legacy occasion codes (before UUID occasion types). */
const OCCASION_LEGACY_ES: Record<string, string> = {
  LUXURY_BIRTHDAY: "Cumpleaños de lujo",
  ANNIVERSARY: "Aniversario",
  ENGAGEMENT_PARTY: "Fiesta de compromiso",
  PRIVATE_VILLA: "Encuentro en villa privada",
  YACHT: "Fiesta en yate",
  INTIMATE_DINNER: "Cena íntima",
  HOME_EVENT: "Celebración en casa",
  HOLIDAY: "Festividad / temporada",
  EXCLUSIVE_SOCIAL: "Velada social exclusiva",
  WEDDING: "Boda",
  CORPORATE_VIP: "Corporativo VIP",
  OTHER: "Otro (descripción aparte)",
};

function labelLegacyOccasion(code: string): string {
  return OCCASION_LEGACY_ES[code] ?? titleCaseLoose(code);
}

function labelEntrySource(code: string): string {
  return ENTRY_SOURCE_ES[code] ?? titleCaseLoose(code);
}

const EXPERIENCE_ADDON_ES: Record<string, string> = {
  FIRE: "Actuación con fuego",
  VEIL_FAN_LED: "Velo, abanico y alas LED",
  SWORD_CANDELABRA: "Espada y candelabro (shamadan)",
};

function labelExperienceAddon(code: string): string {
  return EXPERIENCE_ADDON_ES[code] ?? EXPERIENCE_ADDON_OPTIONS.find((o) => o.value === code)?.label ?? titleCaseLoose(code);
}

function stringArrayField(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.trim());
}

export type InquiryDetailRow = { label: string; value: string };

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
  "sourceCatalogKind",
  "sourceCatalogId",
  "sourceCatalogTitle",
]);

/** Convierte `inquiryDetails` guardado en BD en filas etiquetadas para el admin. */
export function buildInquiryDetailRows(details: unknown): InquiryDetailRow[] {
  if (details === null || details === undefined) return [];
  if (typeof details !== "object" || Array.isArray(details)) return [];

  const d = details as Record<string, unknown>;
  const rows: InquiryDetailRow[] = [];

  const push = (label: string, value: unknown) => {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && !value.trim()) return;
    const v =
      typeof value === "boolean"
        ? value
          ? "Sí"
          : "No"
        : typeof value === "number"
          ? String(value)
          : String(value).trim();
    if (!v) return;
    rows.push({ label, value: v });
  };

  if (typeof d.entrySource === "string") {
    push("Origen del formulario", labelEntrySource(d.entrySource));
  }

  if (d.sourceCatalogKind === "service" || d.sourceCatalogKind === "event") {
    const title = typeof d.sourceCatalogTitle === "string" ? d.sourceCatalogTitle.trim() : "";
    const label =
      d.sourceCatalogKind === "service" ? "Servicio elegido en la web" : "Evento elegido en la web";
    if (title) push(label, title);
  }

  if (typeof d.eventId === "string") push("Evento (id)", d.eventId);
  if (typeof d.eventTypeLabel === "string") push("Tipo de evento", d.eventTypeLabel);
  else if (typeof d.eventTypeId === "string") push("Tipo de evento (id)", d.eventTypeId);

  if (typeof d.occasionSingleLabel === "string") push("Tipo de ocasión", d.occasionSingleLabel);
  else if (typeof d.occasionTypeId === "string") push("Tipo de ocasión (id)", d.occasionTypeId);

  if (typeof d.occasionCode === "string") {
    push("Tipo de ocasión (código antiguo)", labelLegacyOccasion(d.occasionCode));
  }
  if (typeof d.occasionOther === "string") {
    push("Ocasión (detalle libre)", d.occasionOther);
  }

  const bespokeProjectLabels = stringArrayField(d.bespokeProjectLabels);
  if (bespokeProjectLabels.length) {
    push("Proyectos bespoke", bespokeProjectLabels.join(" · "));
  } else {
    const projects = stringArrayField(d.bespokeProjectTypes);
    if (projects.length) push("Tipo de proyecto (legado)", projects.map(titleCaseLoose).join(" · "));
    const ids = stringArrayField(d.occasionTypeIdsProject);
    if (ids.length) push("Proyectos bespoke (ids)", ids.join(", "));
  }

  const bespokeRoleLabels = stringArrayField(d.bespokeRoleLabels);
  if (bespokeRoleLabels.length) {
    push("Roles / colaboración", bespokeRoleLabels.join(" · "));
  } else {
    const roles = stringArrayField(d.bespokeRoles);
    if (roles.length) push("Rol / colaboración (legado)", roles.map(titleCaseLoose).join(" · "));
    const ids = stringArrayField(d.occasionTypeIdsRole);
    if (ids.length) push("Roles bespoke (ids)", ids.join(", "));
  }

  if (typeof d.projectDeadlineNote === "string") {
    push("Plazo o ventana indicada", d.projectDeadlineNote);
  }

  const addons = stringArrayField(d.experienceAddons);
  if (addons.length) {
    push("Experiencias añadidas", addons.map(labelExperienceAddon).join(" · "));
  }

  const start = typeof d.eventTimeStart === "string" ? d.eventTimeStart.trim() : "";
  const end = typeof d.eventTimeEnd === "string" ? d.eventTimeEnd.trim() : "";
  if (start || end) {
    push("Horario indicado", `${start || "—"} – ${end || "—"}`);
  }

  if (typeof d.guestCount === "number" && Number.isFinite(d.guestCount) && d.guestCount >= 0) {
    push("Invitados (aprox.)", String(Math.round(d.guestCount)));
  }

  if (typeof d.eventAddress === "string") push("Dirección del evento", d.eventAddress);

  if (d.venueIndoor === true) push("Espacio", "Interior");
  else if (d.venueIndoor === false) push("Espacio", "Exterior");

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
}: {
  details?: unknown;
  rows?: InquiryDetailRow[];
}) {
  const rows = rowsProp ?? buildInquiryDetailRows(details);
  if (rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-gold/15 bg-black/22 p-4">
      <p className="mb-3 font-brand text-[10px] tracking-[0.18em] text-gold/75">DETALLE DEL FORMULARIO</p>
      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map(({ label, value }, idx) => (
          <div key={idx} className="min-w-0 sm:col-span-1">
            <dt className="font-brand text-[9px] tracking-widest text-gold/55">{label}</dt>
            <dd className="mt-1 break-words font-body text-sm leading-snug text-foreground/85">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
