import { clampPercent } from "./headerMediaUtils";
import type { HeaderMediaType, HeaderPhoto } from "../types/headerMedia.types";

export function mapHeaderPhotoFromApi(row: Record<string, unknown>): HeaderPhoto {
  const mediaTypeRaw = row.mediaType;
  const mediaType =
    mediaTypeRaw === "VIDEO" || mediaTypeRaw === "IMAGE"
      ? (mediaTypeRaw as HeaderMediaType)
      : undefined;
  return {
    id: String(row.id),
    imageUrl: String(row.imageUrl ?? ""),
    mediaType,
    focalX: clampPercent(typeof row.focalX === "number" ? row.focalX : Number(row.focalX)),
    focalY: clampPercent(typeof row.focalY === "number" ? row.focalY : Number(row.focalY)),
    focalMobileX: clampPercent(
      typeof row.focalMobileX === "number" ? row.focalMobileX : Number(row.focalMobileX),
    ),
    focalMobileY: clampPercent(
      typeof row.focalMobileY === "number" ? row.focalMobileY : Number(row.focalMobileY),
    ),
    isActive: Boolean(row.isActive),
    createdAt: typeof row.createdAt === "string" ? row.createdAt : undefined,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
  };
}

export function mapHeaderPhotosFromApi(data: unknown): HeaderPhoto[] {
  if (!Array.isArray(data)) return [];
  return (data as Record<string, unknown>[]).map(mapHeaderPhotoFromApi);
}
