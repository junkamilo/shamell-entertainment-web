/**
 * Service catalog stores media in `imageUrl`. Cloudinary videos use `/video/upload/`;
 * we also treat a few common extensions as video for robustness.
 */
export function serviceCatalogMediaTypeFromUrl(
  url: string | null | undefined,
): "IMAGE" | "VIDEO" | undefined {
  const u = typeof url === "string" ? url.trim() : "";
  if (!u) return undefined;
  const lower = u.toLowerCase();
  if (lower.includes("/video/upload/") || lower.includes("/video/fetch/")) {
    return "VIDEO";
  }
  if (/\.(mp4|webm|mov|m4v|ogv|m3u8)(\?|#|\/|$)/i.test(lower)) return "VIDEO";
  return "IMAGE";
}

export function isVideoMediaFile(file: File): boolean {
  return file.type.startsWith("video/");
}
