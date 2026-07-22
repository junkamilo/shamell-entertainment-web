import type { ServiceTypeItem } from "../types/serviceTypes.types";

export function mapServiceTypeFromApi(row: Record<string, unknown>): ServiceTypeItem {
  return {
    id: String(row.id),
    name: String(row.name),
    isActive: Boolean(row.isActive),
    createdAt: typeof row.createdAt === "string" ? row.createdAt : undefined,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
    serviceCount: typeof row.serviceCount === "number" ? row.serviceCount : 0,
    galleryPhotoCount: typeof row.galleryPhotoCount === "number" ? row.galleryPhotoCount : 0,
  };
}

export function mapServiceTypesFromApi(data: unknown): ServiceTypeItem[] {
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(mapServiceTypeFromApi);
}
