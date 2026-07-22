"use client";

import { useEffect, useState } from "react";
import { getPublicApiBaseUrl } from "@/lib/publicApiBaseUrl";
import { mapHeaderTextFromApi } from "@/lib/headerTextStyleTokens";
import { DEFAULT_HEADER_TEXT, type HeaderTextContent } from "@/lib/headerTextTypes";

export function useHeaderText(initialContent?: HeaderTextContent | null) {
  const [content, setContent] = useState<HeaderTextContent>(
    initialContent ?? DEFAULT_HEADER_TEXT,
  );
  const [isLoading, setIsLoading] = useState(!initialContent);

  useEffect(() => {
    // SSR already provided the header text; no client fetch needed.
    if (initialContent) return;

    let cancelled = false;

    async function load() {
      try {
        const base = getPublicApiBaseUrl();
        const response = await fetch(`${base}/api/v1/header-text`, {
          next: { revalidate: 300 },
        });

        if (!response.ok) {
          if (!cancelled) setContent(DEFAULT_HEADER_TEXT);
          return;
        }

        const data: unknown = await response.json();
        if (!cancelled) {
          setContent(mapHeaderTextFromApi(data));
        }
      } catch {
        if (!cancelled) setContent(DEFAULT_HEADER_TEXT);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [initialContent]);

  return { content, isLoading };
}
