import type { AdminService } from "../types/services.types";

export function mapServiceFromApi(row: Record<string, unknown>): AdminService {
  return {
    id: String(row.id),
    serviceTypeId: String(row.serviceTypeId ?? ""),
    serviceTypeName: String(row.serviceTypeName ?? ""),
    description: String(row.description ?? ""),
    items: Array.isArray(row.items) ? (row.items as unknown[]).map((x) => String(x)) : [],
    price:
      row.price === null || row.price === undefined
        ? null
        : typeof row.price === "number"
          ? row.price
          : Number(row.price),
    imageUrl: typeof row.imageUrl === "string" ? row.imageUrl : null,
    isActive: Boolean(row.isActive),
    bookingCount: typeof row.bookingCount === "number" ? row.bookingCount : 0,
    galleryPhotoCount: typeof row.galleryPhotoCount === "number" ? row.galleryPhotoCount : 0,
  };
}

export function mapServicesFromApi(data: unknown): AdminService[] {
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(mapServiceFromApi);
}
