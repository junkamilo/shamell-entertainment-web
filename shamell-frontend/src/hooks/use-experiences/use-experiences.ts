"use client";

import { useEffect, useState } from "react";
import type { Experience } from "@/lib/services/experiencesData";
import { mapPublicServicesCatalog } from "@/lib/home/mapHomeCatalogSeeds";

export function useExperiences(
  enabled: boolean = true,
  initialExperiences?: Experience[] | null,
) {
  const hasSeed =
    Array.isArray(initialExperiences) && initialExperiences.length > 0;
  const [experiences, setExperiences] = useState<Experience[]>(
    hasSeed ? initialExperiences! : [],
  );
  const [isLoading, setIsLoading] = useState(!hasSeed && enabled);

  useEffect(() => {
    if (hasSeed) {
      setExperiences(initialExperiences!);
      setIsLoading(false);
      return;
    }
    if (!enabled) return;
    const baseUrl = (
      process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001"
    ).replace(/\/$/, "");

    let isCancelled = false;
    setIsLoading(true);

    fetch(`${baseUrl}/api/v1/services`)
      .then((response) => {
        if (!response.ok) throw new Error("Cannot load services.");
        return response.json();
      })
      .then((data: unknown) => {
        if (isCancelled) return;
        setExperiences(mapPublicServicesCatalog(data));
      })
      .catch(() => {
        if (!isCancelled) setExperiences([]);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [enabled, hasSeed, initialExperiences]);

  return { experiences, isLoading };
}
