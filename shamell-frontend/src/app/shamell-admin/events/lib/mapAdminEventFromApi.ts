import type { AdminEvent, CatalogImage } from "../types/events.types";

export function mapAdminEventFromApi(row: Record<string, unknown>): AdminEvent {
  const rawPrice = row.price;
  const priceParsed =
    rawPrice === null || rawPrice === undefined
      ? null
      : typeof rawPrice === "number"
        ? rawPrice
        : Number(rawPrice);
  const catalogRaw = row.catalogImages;
  const catalogImages: CatalogImage[] = Array.isArray(catalogRaw)
    ? (catalogRaw as Record<string, unknown>[]).flatMap((imgRow) => {
        const id = imgRow.id != null ? String(imgRow.id) : "";
        const imageUrl = imgRow.imageUrl != null ? String(imgRow.imageUrl) : "";
        const mediaType =
          imgRow.mediaType != null && typeof imgRow.mediaType === "string"
            ? imgRow.mediaType
            : undefined;
        return id && imageUrl ? [{ id, imageUrl, mediaType }] : [];
      })
    : [];
  return {
    id: String(row.id),
    eventTypeId: String(row.eventTypeId),
    eventTypeName: String(row.eventTypeName ?? ""),
    description: String(row.description ?? ""),
    items: Array.isArray(row.items) ? (row.items as string[]) : [],
    price: Number.isFinite(priceParsed as number) ? (priceParsed as number) : null,
    catalogImages,
    isActive: Boolean(row.isActive),
    showOnHome: row.showOnHome !== undefined ? Boolean(row.showOnHome) : true,
    createdAt: typeof row.createdAt === "string" ? row.createdAt : undefined,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
    bookingCount: typeof row.bookingCount === "number" ? row.bookingCount : 0,
    galleryPhotoCount: typeof row.galleryPhotoCount === "number" ? row.galleryPhotoCount : 0,
  };
}

export function mapAdminEventsFromApi(data: unknown): AdminEvent[] {
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(mapAdminEventFromApi);
}
