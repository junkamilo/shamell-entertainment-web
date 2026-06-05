"use client";

import { useEffect, useState } from "react";
import { getPublicApiBaseUrl } from "@/app/contacto/lib/apiBaseUrl";
import {
  fallbackAboutContent,
  normalizeAboutPayload,
  type AboutContentItem,
} from "@/lib/aboutContent";
import { preloadAboutHeroMedia } from "@/lib/aboutMediaPreload";

export type { AboutContentItem };

export function useAboutContent(initialAbout?: AboutContentItem | null) {
  const [about, setAbout] = useState<AboutContentItem>(
    initialAbout ?? fallbackAboutContent,
  );
  const [isLoading, setIsLoading] = useState(!initialAbout);

  useEffect(() => {
    if (!initialAbout) return;

    let isCancelled = false;
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
      .catch(() => undefined);

    return () => {
      isCancelled = true;
    };
  }, [initialAbout]);

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
  }, [about.videoDeliveryUrl, about.videoPosterUrl, about.heroMediaType, about.imageUrl]);

  return { about, isLoading };
}
