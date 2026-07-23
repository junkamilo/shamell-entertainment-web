import type {
  CreatePrivateClassBookingBody,
  PrivateClassBookingDetails,
  PrivateClassFormFields,
  PrivateClassPaymentMethod,
} from "../types/privateClass.types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parsePrivateClassAmountUsd(raw: string): number | null {
  const n = Number(String(raw).trim().replace(/,/g, ""));
  if (!Number.isFinite(n) || n < 1) return null;
  return Number(n.toFixed(2));
}

export function validatePrivateClassForm(
  fields: PrivateClassFormFields,
): string | null {
  if (!fields.classType.trim()) return "Enter the class type.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.eventDate.trim())) {
    return "Pick a date.";
  }
  if (!/^\d{2}:\d{2}$/.test(fields.eventTimeStart.trim())) {
    return "Pick a start time.";
  }
  if (!fields.location.trim()) return "Enter the location.";
  if (!fields.customerName.trim()) return "Enter the client name.";
  if (!EMAIL_RE.test(fields.customerEmail.trim())) {
    return "Enter a valid email.";
  }
  if (parsePrivateClassAmountUsd(fields.amountUsd) == null) {
    return "Enter a price of at least $1.";
  }
  if (fields.paymentMethod === "cash" && !fields.cashConfirmed) {
    return "Confirm that cash payment was received.";
  }
  return null;
}

export function buildPrivateClassRequestBody(
  fields: PrivateClassFormFields,
): CreatePrivateClassBookingBody | null {
  const amountUsd = parsePrivateClassAmountUsd(fields.amountUsd);
  if (amountUsd == null) return null;
  const phone = fields.customerPhone.trim();
  const notes = fields.notes.trim();
  return {
    classType: fields.classType.trim(),
    eventDate: fields.eventDate.trim(),
    eventTimeStart: fields.eventTimeStart.trim(),
    location: fields.location.trim(),
    customerName: fields.customerName.trim(),
    customerEmail: fields.customerEmail.trim().toLowerCase(),
    ...(phone ? { customerPhone: phone } : {}),
    ...(notes ? { notes } : {}),
    amountUsd,
  };
}

export function buildPrivateClassDetailsSnapshot(
  fields: PrivateClassFormFields,
  paymentMethod: PrivateClassPaymentMethod,
): PrivateClassBookingDetails | null {
  const amountUsd = parsePrivateClassAmountUsd(fields.amountUsd);
  if (amountUsd == null) return null;
  return {
    kind: "private_class",
    classType: fields.classType.trim(),
    eventTimeStart: fields.eventTimeStart.trim(),
    location: fields.location.trim(),
    paymentMethod,
    amountUsd,
    currency: "usd",
    submittedAt: new Date().toISOString(),
    source: "admin_book_class_private",
  };
}
