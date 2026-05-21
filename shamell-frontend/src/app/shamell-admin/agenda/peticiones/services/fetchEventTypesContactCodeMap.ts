import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";

export async function fetchEventTypesContactCodeMap(token: string): Promise<Map<string, string>> {
  const base = getAdminApiBaseUrl();
  const response = await fetch(`${base}/api/v1/events/types/admin`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json: unknown = await response.json().catch(() => []);
  if (!Array.isArray(json)) return new Map();

  const map = new Map<string, string>();
  for (const x of json) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const code = typeof o.contactInquiryCode === "string" ? o.contactInquiryCode.trim() : "";
    if (id && code) map.set(id, code);
  }
  return map;
}
