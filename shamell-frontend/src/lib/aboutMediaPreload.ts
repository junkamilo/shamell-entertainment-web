import type { AboutContentItem } from "@/lib/aboutContent";
import { inferAboutHeroIsVideo } from "@/lib/aboutHeroMedia";

/** URLs to preload for About hero video (poster only; MP4 loads near viewport). */
export function aboutHeroPreloadUrls(about: AboutContentItem): {
  poster: string | null;
  video: string | null;
} {
  const heroIsVideo = inferAboutHeroIsVideo({
    heroMediaType: about.heroMediaType,
    imageUrl: about.imageUrl,
  });
  if (!heroIsVideo) return { poster: null, video: null };
  return {
    poster: about.videoPosterUrl,
    video: about.videoDeliveryUrl ?? about.imageUrl,
  };
}

const injectedLinkKeys = new Set<string>();

function upsertPreloadLink(
  rel: "preload" | "prefetch",
  as: string,
  href: string,
  fetchPriority?: "high" | "low" | "auto",
): () => void {
  const key = `${rel}:${as}:${href}`;
  if (injectedLinkKeys.has(key)) return () => undefined;
  injectedLinkKeys.add(key);

  const link = document.createElement("link");
  link.rel = rel;
  link.as = as;
  link.href = href;
  if (fetchPriority) {
    link.setAttribute("fetchpriority", fetchPriority);
  }
  document.head.appendChild(link);
  return () => {
    link.remove();
    injectedLinkKeys.delete(key);
  };
}

/** Client: inject poster preload as soon as About video URLs are known. */
export function preloadAboutHeroMedia(about: AboutContentItem): () => void {
  if (typeof document === "undefined") return () => undefined;

  const { poster } = aboutHeroPreloadUrls(about);
  if (!poster) return () => undefined;

  return upsertPreloadLink("preload", "image", poster, "high");
}

/** Prefetch MP4 when the user scrolls near #about (low priority, on demand). */
export function prefetchAboutHeroVideo(videoUrl: string): () => void {
  if (typeof document === "undefined" || !videoUrl.trim()) {
    return () => undefined;
  }

  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;
  if (connection?.saveData) return () => undefined;
  if (connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g") {
    return () => undefined;
  }

  return upsertPreloadLink("prefetch", "video", videoUrl, "low");
}
