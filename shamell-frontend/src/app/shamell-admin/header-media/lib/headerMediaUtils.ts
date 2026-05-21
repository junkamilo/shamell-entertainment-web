import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";
import type { HeaderPhoto } from "../types/headerMedia.types";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileKey(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function headerLibraryItemIsVideo(photo: HeaderPhoto): boolean {
  if (photo.mediaType === "VIDEO") return true;
  return serviceCatalogMediaTypeFromUrl(photo.imageUrl) === "VIDEO";
}
