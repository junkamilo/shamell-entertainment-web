import type { AboutContentItem } from "@/lib/aboutContent";
import { inferAboutHeroIsVideo } from "@/lib/aboutHeroMedia";

/** URLs to preload for About hero video (stream + poster). */
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

/** Client: inject preload links as soon as About video URLs are known. */
export function preloadAboutHeroMedia(about: AboutContentItem): () => void {
  if (typeof document === "undefined") return () => undefined;

  const { poster, video } = aboutHeroPreloadUrls(about);
  const cleanups: Array<() => void> = [];

  if (poster) {
    cleanups.push(upsertPreloadLink("preload", "image", poster, "high"));
  }
  if (video) {
    cleanups.push(upsertPreloadLink("preload", "video", video, "low"));
  }

  return () => {
    for (const fn of cleanups) fn();
  };
}
