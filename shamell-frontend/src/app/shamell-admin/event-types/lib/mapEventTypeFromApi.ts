import type { EventTypeItem, OccasionUsage } from "../types/eventTypes.types";

export function mapEventTypeFromApi(row: Record<string, unknown>): EventTypeItem {
  const rawAssign = row.occasionAssignments;
  const occasionAssignments = Array.isArray(rawAssign)
    ? (rawAssign as Record<string, unknown>[]).map((a) => ({
        occasionTypeId: String(a.occasionTypeId),
        usage: String(a.usage) as OccasionUsage,
        sortOrder: typeof a.sortOrder === "number" ? a.sortOrder : 0,
        occasionName: typeof a.occasionName === "string" ? a.occasionName : undefined,
      }))
    : undefined;
  return {
    id: String(row.id),
    name: String(row.name),
    isActive: Boolean(row.isActive),
    catalogChannel:
      row.catalogChannel === "BOOKING" || row.catalogChannel === "UPCOMING_HUB"
        ? row.catalogChannel
        : undefined,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : undefined,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
    eventCount: typeof row.eventCount === "number" ? row.eventCount : 0,
    bookingCount: typeof row.bookingCount === "number" ? row.bookingCount : 0,
    galleryPhotoCount: typeof row.galleryPhotoCount === "number" ? row.galleryPhotoCount : 0,
    occasionAssignments,
  };
}

export function mapEventTypesFromApi(data: unknown): EventTypeItem[] {
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(mapEventTypeFromApi);
}
