export type PublicHeaderPhoto = {
  id: string;
  imageUrl: string;
  mediaType: "IMAGE" | "VIDEO";
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

function normalizeHeaderPhoto(item: unknown): PublicHeaderPhoto | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const imageUrl =
    typeof row.imageUrl === "string" ? row.imageUrl.trim() : "";
  if (!imageUrl) return null;
  const mediaType = row.mediaType === "VIDEO" ? "VIDEO" : "IMAGE";
  return {
    id: typeof row.id === "string" ? row.id : imageUrl,
    imageUrl,
    mediaType,
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
    if (!Array.isArray(data)) return [];
    return data
      .map(normalizeHeaderPhoto)
      .filter((item): item is PublicHeaderPhoto => item !== null);
  } catch {
    return [];
  }
}
