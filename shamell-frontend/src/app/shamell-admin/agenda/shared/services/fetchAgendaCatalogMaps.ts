import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";

export type FetchAgendaCatalogMapsOptions = {
  token: string;
  includeOccasions?: boolean;
  includeContactLines?: boolean;
};

export type AgendaCatalogMapsRaw = {
  services: unknown;
  eventTypes: unknown;
  occasions?: unknown;
  contactLines?: unknown;
};

export async function fetchAgendaCatalogMaps({
  token,
  includeOccasions = false,
  includeContactLines = false,
}: FetchAgendaCatalogMapsOptions): Promise<AgendaCatalogMapsRaw> {
  const base = getAdminApiBaseUrl();
  const headers = { Authorization: `Bearer ${token}` };

  const requests: Promise<Response>[] = [
    fetch(`${base}/api/v1/services/admin`, { headers, cache: "no-store" }),
    fetch(`${base}/api/v1/events/types/admin`, { headers, cache: "no-store" }),
  ];

  if (includeOccasions) {
    requests.push(
      fetch(`${base}/api/v1/events/occasions/admin`, { headers, cache: "no-store" }),
    );
  }

  if (includeContactLines) {
    requests.push(
      fetch(`${base}/api/v1/events/contact-lines`, { headers, cache: "no-store" }),
    );
  }

  const responses = await Promise.all(requests);
  const json = await Promise.all(responses.map((res) => res.json().catch(() => [])));

  const result: AgendaCatalogMapsRaw = {
    services: json[0],
    eventTypes: json[1],
  };

  let index = 2;
  if (includeOccasions) {
    result.occasions = json[index];
    index += 1;
  }
  if (includeContactLines) {
    result.contactLines = json[index];
  }

  return result;
}

export function parseContactLinesInquiryMap(data: unknown): Map<string, string> {
  if (!Array.isArray(data)) return new Map();

  const map = new Map<string, string>();
  for (const x of data) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const code = typeof o.contactInquiryCode === "string" ? o.contactInquiryCode.trim() : "";
    if (id && code) map.set(id, code);
  }
  return map;
}

export function parseEventTypesContactCodeMap(data: unknown): Map<string, string> {
  if (!Array.isArray(data)) return new Map();

  const map = new Map<string, string>();
  for (const x of data) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const code = typeof o.contactInquiryCode === "string" ? o.contactInquiryCode.trim() : "";
    if (id && code) map.set(id, code);
  }
  return map;
}

export type ServicesInquiryMapResult = {
  serviceByInquiryCode: Map<string, string>;
  fallbackServiceId?: string;
};

export function parseServicesInquiryMap(data: unknown): ServicesInquiryMapResult {
  if (!Array.isArray(data)) {
    return { serviceByInquiryCode: new Map() };
  }

  const map = new Map<string, string>();
  const activeServiceIds: string[] = [];
  for (const x of data) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const code = typeof o.contactInquiryCode === "string" ? o.contactInquiryCode.trim() : "";
    const isActive = o.isActive !== false;
    if (id && isActive) activeServiceIds.push(id);
    if (id && code && !map.has(code)) map.set(code, id);
  }

  return {
    serviceByInquiryCode: map,
    fallbackServiceId: activeServiceIds.length > 0 ? activeServiceIds[0] : undefined,
  };
}
