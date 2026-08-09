import {
  ABOUT_VIDEO_POSTER_TRANSFORM,
  ABOUT_VIDEO_STREAM_TRANSFORM,
  ABOUT_VIDEO_UPLOAD_MARKER,
} from '../constants/about.constants';

type CloudinaryEagerResult = { secure_url?: string };

export function videoDeliveryUrlsFromUpload(result: {
  secure_url?: string;
  eager?: CloudinaryEagerResult[];
}): { videoDeliveryUrl: string | null; videoPosterUrl: string | null } {
  const base = result.secure_url?.trim() ?? '';
  const eager = result.eager ?? [];
  const stream =
    eager[0]?.secure_url?.trim() ||
    (base ? buildAboutHeroVideoDeliveryUrl(base) : null);
  const poster =
    eager[1]?.secure_url?.trim() ||
    (base ? buildAboutHeroVideoPosterUrl(base) : null);
  return { videoDeliveryUrl: stream, videoPosterUrl: poster };
}

function injectCloudinaryVideoTransform(
  url: string,
  transform: string,
): string {
  if (!url.includes(ABOUT_VIDEO_UPLOAD_MARKER)) return url;

  const markerIdx = url.indexOf(ABOUT_VIDEO_UPLOAD_MARKER);
  const prefix = url.slice(0, markerIdx + ABOUT_VIDEO_UPLOAD_MARKER.length);
  const suffix = url.slice(markerIdx + ABOUT_VIDEO_UPLOAD_MARKER.length);
  const firstSegment = suffix.split('/')[0] ?? '';

  if (
    firstSegment.includes(',') ||
    firstSegment.includes('q_auto') ||
    firstSegment.includes('w_720')
  ) {
    return url;
  }

  return `${prefix}${transform}/${suffix}`;
}

export function buildAboutHeroVideoDeliveryUrl(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null;
  return injectCloudinaryVideoTransform(
    url.trim(),
    ABOUT_VIDEO_STREAM_TRANSFORM,
  );
}

export function buildAboutHeroVideoPosterUrl(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null;
  const poster = injectCloudinaryVideoTransform(
    url.trim(),
    ABOUT_VIDEO_POSTER_TRANSFORM,
  );
  return poster.replace(/\.(mp4|mov|webm|m4v)(\?.*)?$/i, '.jpg$2');
}

/** Re-export eager constants for upload callers. */
export {
  ABOUT_VIDEO_EAGER_STREAM,
  ABOUT_VIDEO_EAGER_POSTER,
  ABOUT_VIDEO_UPLOAD_EAGER,
} from '../constants/about.constants';
