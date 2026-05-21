import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { AgendarCatalog, IdName } from "../types/agendar.types";

function parseServices(data: unknown): AgendarCatalog["services"] {
  if (!Array.isArray(data)) return [];
  return data
    .map((x) => {
      const row = x as Record<string, unknown>;
      return {
        id: String(row.id ?? ""),
        serviceTypeName: String(row.serviceTypeName ?? row.description ?? "Service"),
      };
    })
    .filter((s) => s.id);
}

function parseIdNameList(data: unknown): IdName[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((x) => {
      const row = x as Record<string, unknown>;
      return { id: String(row.id ?? ""), name: String(row.name ?? "") };
    })
    .filter((item) => item.id);
}

export async function fetchAgendarCatalog(token: string): Promise<AgendarCatalog> {
  const base = getAdminApiBaseUrl();
  const headers = { Authorization: `Bearer ${token}` };

  const [svcRes, typesRes, occRes] = await Promise.all([
    fetch(`${base}/api/v1/services/admin`, { headers, cache: "no-store" }),
    fetch(`${base}/api/v1/events/types/admin`, { headers, cache: "no-store" }),
    fetch(`${base}/api/v1/events/occasions/admin`, { headers, cache: "no-store" }),
  ]);

  const [svcJson, typesJson, occJson] = await Promise.all([
    svcRes.json(),
    typesRes.json(),
    occRes.json(),
  ]);

  return {
    services: parseServices(svcJson),
    eventTypes: parseIdNameList(typesJson),
    occasions: parseIdNameList(occJson),
  };
}
