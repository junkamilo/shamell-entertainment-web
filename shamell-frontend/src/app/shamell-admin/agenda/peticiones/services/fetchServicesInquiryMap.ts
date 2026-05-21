import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";

export type ServicesInquiryMapResult = {
  serviceByInquiryCode: Map<string, string>;
  fallbackServiceId?: string;
};

export async function fetchServicesInquiryMap(token: string): Promise<ServicesInquiryMapResult> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/services/admin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json: unknown = await response.json().catch(() => []);
  if (!Array.isArray(json)) {
    return { serviceByInquiryCode: new Map() };
  }

  const map = new Map<string, string>();
  const activeServiceIds: string[] = [];
  for (const x of json) {
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
