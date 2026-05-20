import type { ContactLine } from "../components/ContactInquiryForm";
import { getPublicApiBaseUrl } from "../lib/apiBaseUrl";

export async function fetchPublicContactLines(): Promise<ContactLine[]> {
  const base = getPublicApiBaseUrl();
  const res = await fetch(`${base}/api/v1/events/contact-lines`);
  if (!res.ok) throw new Error("lines");
  const json: unknown = await res.json();
  if (!Array.isArray(json)) return [];

  const parsed: ContactLine[] = [];
  for (const row of json as Record<string, unknown>[]) {
    const id = typeof row.id === "string" ? row.id : "";
    const eventTypeId = typeof row.eventTypeId === "string" ? row.eventTypeId : "";
    const eventTypeName = typeof row.eventTypeName === "string" ? row.eventTypeName : "";
    if (!id || !eventTypeId) continue;
    const mapOpts = (v: unknown): { id: string; name: string }[] => {
      if (!Array.isArray(v)) return [];
      return v
        .map((x) => {
          const o = x as Record<string, unknown>;
          const oid = typeof o.id === "string" ? o.id : "";
          const name = typeof o.name === "string" ? o.name : "";
          return oid && name ? { id: oid, name } : null;
        })
        .filter(Boolean) as { id: string; name: string }[];
    };
    parsed.push({
      id,
      eventTypeId,
      eventTypeName,
      contactInquiryCode: typeof row.contactInquiryCode === "string" ? row.contactInquiryCode : null,
      description: typeof row.description === "string" ? row.description : "",
      items: Array.isArray(row.items)
        ? (row.items as unknown[]).map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean)
        : [],
      images: Array.isArray(row.images)
        ? (row.images as unknown[]).map((v) => (typeof v === "string" ? v.trim() : "")).filter(Boolean)
        : [],
      heroImageUrl:
        typeof row.heroImageUrl === "string" && row.heroImageUrl.trim().length > 0
          ? row.heroImageUrl.trim()
          : undefined,
      heroMediaType:
        typeof row.heroMediaType === "string" && row.heroMediaType.trim().length > 0
          ? row.heroMediaType.trim()
          : undefined,
      lineKind: row.lineKind === "event_type" ? "event_type" : "event",
      price: (() => {
        const raw = row.price;
        if (raw == null || raw === "") return null;
        const n = typeof raw === "number" ? raw : Number(raw);
        return Number.isFinite(n) ? n : null;
      })(),
      occasionSingle: mapOpts(row.occasionSingle),
      occasionBespokeProject: mapOpts(row.occasionBespokeProject),
      occasionBespokeRole: mapOpts(row.occasionBespokeRole),
    });
  }
  return parsed;
}
