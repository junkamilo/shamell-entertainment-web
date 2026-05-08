export type AgendarFormValues = {
  serviceId: string;
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

export function validateAgendarForm(values: AgendarFormValues): {
  error: string | null;
  normalized: NormalizedAgendarForm | null;
} {
  const serviceId = values.serviceId.trim();
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

  if (!eventTypeId) return { error: "Falta el campo obligatorio: Tipo de evento.", normalized: null };
  if (!occasionTypeId) return { error: "Falta el campo obligatorio: Ocasión.", normalized: null };
  if (!serviceId) return { error: "Falta el campo obligatorio: Servicio.", normalized: null };
  if (!eventDateIso) return { error: "Falta el campo obligatorio: Fecha del evento.", normalized: null };
  if (!ISO_DATE_RE.test(eventDateIso)) return { error: "La fecha del evento no es válida.", normalized: null };
  if (!eventTimeStart) return { error: "Falta el campo obligatorio: Hora inicial.", normalized: null };
  if (!eventTimeEnd) return { error: "Falta el campo obligatorio: Hora final.", normalized: null };

  if (!location) return { error: "Falta el campo obligatorio: Ubicación.", normalized: null };
  if (location.length < 3 || location.length > 120) {
    return { error: "Ubicación debe tener entre 3 y 120 caracteres.", normalized: null };
  }

  if (!guestFullName) return { error: "Falta el campo obligatorio: Cliente — Nombre.", normalized: null };
  if (guestFullName.length < 3 || guestFullName.length > 90) {
    return { error: "Nombre del cliente debe tener entre 3 y 90 caracteres.", normalized: null };
  }
  if (/\d/.test(guestFullName)) {
    return { error: "El nombre del cliente no debe incluir números.", normalized: null };
  }

  if (!guestEmail) return { error: "Falta el campo obligatorio: Email.", normalized: null };
  if (guestEmail.length > 120 || !EMAIL_RE.test(guestEmail)) {
    return { error: "Email inválido. Ejemplo: correo@ejemplo.com", normalized: null };
  }

  if (!guestPhone) return { error: "Falta el campo obligatorio: Teléfono.", normalized: null };
  const phoneDigits = guestPhone.replace(/\D/g, "");
  // Alineado con el formulario público de contacto (7+ dígitos).
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return { error: "Teléfono inválido. Debe tener entre 7 y 15 dígitos.", normalized: null };
  }

  if (!guestCountRaw) return { error: "Falta el campo obligatorio: Invitados.", normalized: null };
  const guestCount = Number(guestCountRaw);
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20000) {
    return { error: "Invitados debe ser un número entero entre 1 y 20000.", normalized: null };
  }

  if (notes.length > 1000) {
    return { error: "Notas internas no puede superar 1000 caracteres.", normalized: null };
  }

  return {
    error: null,
    normalized: {
      serviceId,
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
