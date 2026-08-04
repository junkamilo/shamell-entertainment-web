export type PublicHeaderPhoto = {
  id: string;
  mediaType: "IMAGE" | "VIDEO";
  imageUrl: string | null;
  imageUrlMobile: string | null;
  videoDeliveryUrl: string | null;
  videoPosterUrl: string | null;
  videoPosterUrlMobile: string | null;
  focalX?: number;
  focalY?: number;
  focalMobileX?: number;
  focalMobileY?: number;
};

const HEADER_MEDIA_REVALIDATE_SEC = 120;

function clampPercent(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeHeaderPhotos(data: unknown): PublicHeaderPhoto[] {
  if (!Array.isArray(data)) return [];
  return data
    .map(normalizeHeaderPhoto)
    .filter((item): item is PublicHeaderPhoto => item !== null);
}

function trimmedOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeHeaderPhoto(item: unknown): PublicHeaderPhoto | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const mediaType = row.mediaType === "VIDEO" ? "VIDEO" : "IMAGE";
  const imageUrl = trimmedOrNull(row.imageUrl);
  const videoDeliveryUrl = trimmedOrNull(row.videoDeliveryUrl);
  // Keep the item if it carries any playable/displayable source.
  if (!imageUrl && !videoDeliveryUrl) return null;
  return {
    id: typeof row.id === "string" ? row.id : (imageUrl ?? videoDeliveryUrl)!,
    mediaType,
    imageUrl,
    imageUrlMobile: trimmedOrNull(row.imageUrlMobile),
    videoDeliveryUrl,
    videoPosterUrl: trimmedOrNull(row.videoPosterUrl),
    videoPosterUrlMobile: trimmedOrNull(row.videoPosterUrlMobile),
    focalX: clampPercent(row.focalX),
    focalY: clampPercent(row.focalY),
    focalMobileX: clampPercent(row.focalMobileX),
    focalMobileY: clampPercent(row.focalMobileY),
  };
}

export async function fetchPublicHeaderMedia(): Promise<PublicHeaderPhoto[]> {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:3001";

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/header-media`, {
      next: { revalidate: HEADER_MEDIA_REVALIDATE_SEC },
    });
    if (!response.ok) return [];
    const data = await response.json().catch(() => []);
    return normalizeHeaderPhotos(data);
  } catch {
    return [];
  }
}
