/** Append Cloudinary delivery transforms for public API responses (non-destructive). */
export function cloudinaryDeliveryUrl(
  url: string | null | undefined,
  options?: { width?: number; quality?: string },
): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (!trimmed.includes('res.cloudinary.com')) return trimmed;

  const uploadMarker = '/upload/';
  const idx = trimmed.indexOf(uploadMarker);
  if (idx === -1) return trimmed;

  const width = options?.width ?? 1600;
  const quality = options?.quality ?? 'auto';
  const transform = `f_auto,q_${quality},w_${width}`;
  const prefix = trimmed.slice(0, idx + uploadMarker.length);
  const suffix = trimmed.slice(idx + uploadMarker.length);
  if (suffix.startsWith(`${transform}/`) || suffix.includes('/f_auto')) {
    return trimmed;
  }
  return `${prefix}${transform}/${suffix}`;
}
