import { SERVICE_TYPE_CODES, type ServiceTypeCode } from "@/lib/contactInquiryConstants";

function isServiceTypeCode(s: string): s is ServiceTypeCode {
  return SERVICE_TYPE_CODES.includes(s as ServiceTypeCode);
}

/** Asunto mostrado en admin: sin sufijo técnico y copy neutro en español cuando aplica. */
export function formatContactSubjectForAdmin(subject: string | null | undefined): string {
  if (!subject?.trim()) return "Consulta de reserva";
  let s = subject.trim();
  const m = / — ([A-Z_]+)$/.exec(s);
  if (m && isServiceTypeCode(m[1])) {
    s = s.slice(0, m.index).trim();
  }
  if (/^Reservation inquiry$/i.test(s)) return "Consulta de reserva";
  return s.length ? s : "Consulta de reserva";
}
