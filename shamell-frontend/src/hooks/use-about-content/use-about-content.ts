"use client";

import { useEffect, useState } from "react";
import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";
import {
  fallbackAboutContent,
  normalizeAboutPayload,
  type AboutContentItem,
} from "@/lib/about/aboutContent";
import { preloadAboutHeroMedia } from "@/lib/hero/aboutMediaPreload";

export type { AboutContentItem };

export function useAboutContent(initialAbout?: AboutContentItem | null) {
  const [about, setAbout] = useState<AboutContentItem>(
    initialAbout ?? fallbackAboutContent,
  );
  const [isLoading, setIsLoading] = useState(!initialAbout);

  useEffect(() => {
    if (initialAbout) return;

    let isCancelled = false;
    setIsLoading(true);
    const apiBaseUrl = getPublicApiBaseUrl();

    fetch(`${apiBaseUrl}/api/v1/about`)
      .then((response) => {
        if (!response.ok) throw new Error("Cannot load about content.");
        return response.json();
      })
      .then((data: unknown) => {
        if (isCancelled) return;
        const normalized = normalizeAboutPayload(data);
        if (normalized) setAbout(normalized);
      })
      .catch(() => {
        if (!isCancelled) setAbout(fallbackAboutContent);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [initialAbout]);

  useEffect(() => {
    return preloadAboutHeroMedia(about);
  }, [about]);

  return { about, isLoading };
}
