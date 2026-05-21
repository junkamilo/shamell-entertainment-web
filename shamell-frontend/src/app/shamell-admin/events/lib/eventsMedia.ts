export function isVideoCatalogItem(row: { mediaType?: string }) {
  return (row.mediaType ?? "IMAGE").toUpperCase() === "VIDEO";
}

export function isVideoFile(f: File) {
  return f.type.startsWith("video/");
}

/** MIME or filename extension — some mobile pickers leave `type` empty. */
export function isCatalogMediaFile(f: File) {
  const t = f.type.toLowerCase();
  if (t.startsWith("image/") || t.startsWith("video/")) return true;
  if (!t || t === "application/octet-stream") {
    return /\.(jpe?g|png|gif|webp|avif|heic|heif|bmp|mp4|webm|mov|mkv|m4v|avi)$/i.test(f.name);
  }
  return false;
}
