import type { OccasionTypeItem } from "../types/occasionTypes.types";

export function mapOccasionTypeFromApi(row: Record<string, unknown>): OccasionTypeItem {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    isActive: Boolean(row.isActive),
    createdAt: typeof row.createdAt === "string" ? row.createdAt : undefined,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
    bookingCount: typeof row.bookingCount === "number" ? row.bookingCount : 0,
    eventTypeLinkCount:
      typeof row.eventTypeLinkCount === "number" ? row.eventTypeLinkCount : 0,
  };
}

export function mapOccasionTypesFromApi(data: unknown): OccasionTypeItem[] {
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(mapOccasionTypeFromApi);
}
