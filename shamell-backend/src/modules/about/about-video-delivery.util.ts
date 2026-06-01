const VIDEO_UPLOAD_MARKER = '/video/upload/';

const STREAM_TRANSFORM = 'q_auto:eco,vc_h264,w_720,c_limit,f_mp4';
const POSTER_TRANSFORM = 'so_0,w_720,c_limit,q_auto,f_jpg';

function injectCloudinaryVideoTransform(
  url: string,
  transform: string,
): string {
  if (!url.includes(VIDEO_UPLOAD_MARKER)) return url;

  const markerIdx = url.indexOf(VIDEO_UPLOAD_MARKER);
  const prefix = url.slice(0, markerIdx + VIDEO_UPLOAD_MARKER.length);
  const suffix = url.slice(markerIdx + VIDEO_UPLOAD_MARKER.length);
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
  return injectCloudinaryVideoTransform(url.trim(), STREAM_TRANSFORM);
}

export function buildAboutHeroVideoPosterUrl(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null;
  const poster = injectCloudinaryVideoTransform(url.trim(), POSTER_TRANSFORM);
  return poster.replace(/\.(mp4|mov|webm|m4v)(\?.*)?$/i, '.jpg$2');
}
