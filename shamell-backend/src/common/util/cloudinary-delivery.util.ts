export type ImagePreset =
  | 'hero'
  | 'heroMobile'
  | 'card'
  | 'galleryThumb'
  | 'portrait';
export type VideoVariant =
  | 'stream720'
  | 'stream480'
  | 'poster720'
  | 'poster480';

const IMAGE_PRESETS: Record<ImagePreset, string> = {
  hero: 'f_auto,q_auto,w_1920,c_limit',
  heroMobile: 'f_auto,q_auto,w_960,c_limit',
  card: 'f_auto,q_auto,w_800,c_limit',
  galleryThumb: 'f_auto,q_auto,w_1200,c_limit',
  portrait: 'f_auto,q_auto,w_540,c_limit',
};

const VIDEO_VARIANTS: Record<VideoVariant, string> = {
  stream720: 'q_auto:eco,vc_h264,w_720,c_limit,f_mp4',
  stream480: 'q_auto:eco,vc_h264,w_480,c_limit,f_mp4',
  poster720: 'so_0,w_720,c_limit,q_auto,f_jpg',
  poster480: 'so_0,w_480,c_limit,q_auto,f_jpg',
};

const IMAGE_UPLOAD_MARKER = '/image/upload/';
const VIDEO_UPLOAD_MARKER = '/video/upload/';

/** True when the first path segment after /upload/ already carries a transform. */
function hasExistingTransform(firstSegment: string): boolean {
  return (
    firstSegment.includes(',') ||
    firstSegment.includes('f_auto') ||
    firstSegment.includes('q_auto') ||
    firstSegment.startsWith('w_') ||
    firstSegment.includes('vc_') ||
    firstSegment.includes('so_')
  );
}

/** Inject a Cloudinary transform after the upload marker; idempotent and non-destructive. */
function injectTransform(
  url: string | null | undefined,
  transform: string,
): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  if (!trimmed.includes('res.cloudinary.com')) return trimmed;

  const marker = trimmed.includes(VIDEO_UPLOAD_MARKER)
    ? VIDEO_UPLOAD_MARKER
    : IMAGE_UPLOAD_MARKER;
  const idx = trimmed.indexOf(marker);
  if (idx === -1) return trimmed;

  const prefix = trimmed.slice(0, idx + marker.length);
  const suffix = trimmed.slice(idx + marker.length);
  const firstSegment = suffix.split('/')[0] ?? '';
  if (hasExistingTransform(firstSegment)) {
    return trimmed;
  }

  return `${prefix}${transform}/${suffix}`;
}

/** Optimized image delivery URL for a named slot preset. */
export function imageUrl(
  rawUrl: string | null | undefined,
  preset: ImagePreset,
): string | null {
  return injectTransform(rawUrl, IMAGE_PRESETS[preset]);
}

/** Optimized video (stream or poster) delivery URL for a named variant. */
export function videoUrl(
  rawUrl: string | null | undefined,
  variant: VideoVariant,
): string | null {
  const out = injectTransform(rawUrl, VIDEO_VARIANTS[variant]);
  if (!out) return null;
  if (variant === 'poster720' || variant === 'poster480') {
    return out.replace(/\.(mp4|mov|webm|m4v)(\?.*)?$/i, '.jpg$2');
  }
  return out;
}

/** Hero/catalog helper: pick image preset or video variant based on media type. */
export function mediaDeliveryUrl(
  rawUrl: string | null | undefined,
  isVideo: boolean,
  imagePreset: ImagePreset,
  videoVariant: VideoVariant,
): string | null {
  return isVideo
    ? videoUrl(rawUrl, videoVariant)
    : imageUrl(rawUrl, imagePreset);
}

/**
 * Legacy wrapper kept for existing callers and tests.
 * Maps width/quality to an `f_auto,q_<q>,w_<w>,c_limit` image transform.
 */
export function cloudinaryDeliveryUrl(
  url: string | null | undefined,
  options?: { width?: number; quality?: string },
): string | null {
  if (!url?.trim()) return null;
  const width = options?.width ?? 1600;
  const quality = options?.quality ?? 'auto';
  return injectTransform(url, `f_auto,q_${quality},w_${width},c_limit`);
}
