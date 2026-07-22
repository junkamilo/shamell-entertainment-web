import { getAdminApiBaseUrl } from "@/app/admin/shared/lib/adminApiBaseUrl";
import type { AgendarCatalog } from "../types/agendar.types";

type AgendarCatalogApiResponse = {
  services?: Array<{ id?: string; serviceTypeName?: string }>;
  eventTypes?: Array<{ id?: string; name?: string }>;
  occasions?: Array<{ id?: string; name?: string }>;
};

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

function parseIdNameList(data: unknown): AgendarCatalog["eventTypes"] {
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
  const response = await fetch(`${base}/api/v1/agenda/agendar/catalog`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!response.ok) {
    const fallback = await fetchAgendarCatalogLegacy(token);
    return fallback;
  }

  const raw = (await response.json().catch(() => ({}))) as AgendarCatalogApiResponse;
  return {
    services: parseServices(raw.services),
    eventTypes: parseIdNameList(raw.eventTypes),
    occasions: parseIdNameList(raw.occasions),
  };
}

/** Fallback when aggregated endpoint is unavailable (older backend). */
async function fetchAgendarCatalogLegacy(token: string): Promise<AgendarCatalog> {
  const { fetchAgendaCatalogMaps } = await import(
    "../../shared/services/fetchAgendaCatalogMaps"
  );
  const data = await fetchAgendaCatalogMaps({
    token,
    includeOccasions: true,
  });
  return {
    services: parseServices(data.services),
    eventTypes: parseIdNameList(data.eventTypes),
    occasions: parseIdNameList(data.occasions),
  };
}
