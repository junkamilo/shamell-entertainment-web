"use client";

import { useEffect, useState } from "react";
import { getPublicApiBaseUrl } from "@/app/contacto/lib/apiBaseUrl";
import { mapHeaderTextFromApi } from "@/lib/headerTextStyleTokens";
import { DEFAULT_HEADER_TEXT, type HeaderTextContent } from "@/lib/headerTextTypes";

export function useHeaderText() {
  const [content, setContent] = useState<HeaderTextContent>(DEFAULT_HEADER_TEXT);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const base = getPublicApiBaseUrl();
        const response = await fetch(`${base}/api/v1/header-text`, {
          cache: "no-store",
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
  }, []);

  return { content, isLoading };
}
