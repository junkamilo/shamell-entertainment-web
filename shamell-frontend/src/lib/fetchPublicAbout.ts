import {
  fallbackAboutContent,
  normalizeAboutPayload,
} from "@/lib/aboutContent";
import type { AboutContentItem } from "@/lib/aboutContent";

const ABOUT_REVALIDATE_SEC = 300;

export async function fetchPublicAbout(): Promise<AboutContentItem> {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:3001";

  try {
    const response = await fetch(`${apiBaseUrl}/api/v1/about`, {
      next: { revalidate: ABOUT_REVALIDATE_SEC },
    });
    if (!response.ok) return fallbackAboutContent;
    const normalized = normalizeAboutPayload(await response.json());
    return normalized ?? fallbackAboutContent;
  } catch {
    return fallbackAboutContent;
  }
}
