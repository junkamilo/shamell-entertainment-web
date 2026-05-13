export type AgendarFormValues = {
  serviceIds: string[];
  eventTypeId: string;
  occasionTypeId: string;
  eventDateIso: string;
  eventTimeStart: string;
  eventTimeEnd: string;
  location: string;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string;
  guestCount: string;
  notes: string;
};

export type NormalizedAgendarForm = Omit<AgendarFormValues, "guestCount"> & {
  guestCount: number;
  /** Same as `serviceIds[0]`; sent as top-level `serviceId` to the API. */
  serviceId: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function compactSpaces(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function sanitizeNameInput(value: string): string {
  return value.replace(/[0-9]/g, "");
}

export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^0-9+\-\s()]/g, "");
}

export function sanitizeIntegerInput(value: string): string {
  return value.replace(/[^\d]/g, "");
}

/** Per-section completion for mobile Book UI (aligned with `validateAgendarForm` rules). */
export function getAgendarMobileSectionStatus(values: AgendarFormValues): {
  event: boolean;
  logistics: boolean;
  client: boolean;
} {
  const serviceIds = values.serviceIds.filter((id) => id.trim().length > 0);
  const eventTypeId = values.eventTypeId.trim();
  const occasionTypeId = values.occasionTypeId.trim();
  const event = Boolean(eventTypeId && occasionTypeId && serviceIds.length > 0);

  const eventDateIso = values.eventDateIso.trim();
  const eventTimeStart = values.eventTimeStart.trim();
  const eventTimeEnd = values.eventTimeEnd.trim();
  const location = compactSpaces(values.location);
  const logistics =
    Boolean(eventDateIso && ISO_DATE_RE.test(eventDateIso) && eventTimeStart && eventTimeEnd) &&
    location.length >= 3 &&
    location.length <= 120;

  const guestFullName = compactSpaces(values.guestFullName);
  const guestEmail = values.guestEmail.trim().toLowerCase();
  const guestPhone = compactSpaces(values.guestPhone);
  const guestCountRaw = values.guestCount.trim();
  const notes = values.notes.trim();
  const phoneDigits = guestPhone.replace(/\D/g, "");
  const guestCount = Number(guestCountRaw);

  const client =
    guestFullName.length >= 3 &&
    guestFullName.length <= 90 &&
    !/\d/.test(guestFullName) &&
    Boolean(guestEmail) &&
    guestEmail.length <= 120 &&
    EMAIL_RE.test(guestEmail) &&
    Boolean(guestPhone) &&
    phoneDigits.length >= 7 &&
    phoneDigits.length <= 15 &&
    Boolean(guestCountRaw) &&
    Number.isInteger(guestCount) &&
    guestCount >= 1 &&
    guestCount <= 20000 &&
    notes.length <= 1000;

  return { event, logistics, client };
}

export function validateAgendarForm(values: AgendarFormValues): {
  error: string | null;
  normalized: NormalizedAgendarForm | null;
} {
  const serviceIds = values.serviceIds.filter((id) => id.trim().length > 0);
  const eventTypeId = values.eventTypeId.trim();
  const occasionTypeId = values.occasionTypeId.trim();
  const eventDateIso = values.eventDateIso.trim();
  const eventTimeStart = values.eventTimeStart.trim();
  const eventTimeEnd = values.eventTimeEnd.trim();
  const location = compactSpaces(values.location);
  const guestFullName = compactSpaces(values.guestFullName);
  const guestEmail = values.guestEmail.trim().toLowerCase();
  const guestPhone = compactSpaces(values.guestPhone);
  const guestCountRaw = values.guestCount.trim();
  const notes = values.notes.trim();

  if (!eventTypeId) return { error: "Required field missing: Event type.", normalized: null };
  if (!occasionTypeId) return { error: "Required field missing: Occasion.", normalized: null };
  if (serviceIds.length < 1) return { error: "Select at least one service.", normalized: null };
  if (!eventDateIso) return { error: "Required field missing: Event date.", normalized: null };
  if (!ISO_DATE_RE.test(eventDateIso)) return { error: "Event date is not valid.", normalized: null };
  if (!eventTimeStart) return { error: "Required field missing: Start time.", normalized: null };
  if (!eventTimeEnd) return { error: "Required field missing: End time.", normalized: null };

  if (!location) return { error: "Required field missing: Location.", normalized: null };
  if (location.length < 3 || location.length > 120) {
    return { error: "Location must be between 3 and 120 characters.", normalized: null };
  }

  if (!guestFullName) return { error: "Required field missing: Client — Name.", normalized: null };
  if (guestFullName.length < 3 || guestFullName.length > 90) {
    return { error: "Client name must be between 3 and 90 characters.", normalized: null };
  }
  if (/\d/.test(guestFullName)) {
    return { error: "Client name must not include numbers.", normalized: null };
  }

  if (!guestEmail) return { error: "Required field missing: Email.", normalized: null };
  if (guestEmail.length > 120 || !EMAIL_RE.test(guestEmail)) {
    return { error: "Invalid email. Example: name@example.com", normalized: null };
  }

  if (!guestPhone) return { error: "Required field missing: Phone.", normalized: null };
  const phoneDigits = guestPhone.replace(/\D/g, "");
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return { error: "Invalid phone. It must have between 7 and 15 digits.", normalized: null };
  }

  if (!guestCountRaw) return { error: "Required field missing: Guest count.", normalized: null };
  const guestCount = Number(guestCountRaw);
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20000) {
    return { error: "Guest count must be a whole number between 1 and 20,000.", normalized: null };
  }

  if (notes.length > 1000) {
    return { error: "Internal notes cannot exceed 1,000 characters.", normalized: null };
  }

  return {
    error: null,
    normalized: {
      serviceId: serviceIds[0],
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
    },
  };
}
