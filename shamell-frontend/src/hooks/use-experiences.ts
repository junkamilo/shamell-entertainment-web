"use client";

import { useEffect, useState } from "react";
import type { Experience } from "@/lib/experiencesData";

type ServicesApiItem = {
  id?: string;
  serviceTypeName?: string;
  description?: string;
  items?: string[];
  imageUrl?: string | null;
};

const isValidService = (item: ServicesApiItem): item is Required<Pick<ServicesApiItem, "id" | "serviceTypeName" | "description" | "items" | "imageUrl">> =>
  Boolean(
    item.id &&
      item.serviceTypeName &&
      item.description &&
      Array.isArray(item.items) &&
      item.items.length > 0 &&
      item.imageUrl,
  );

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function useExperiences() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3001").replace(/\/$/, "");

    let isCancelled = false;
    setIsLoading(true);

    fetch(`${baseUrl}/api/v1/services`)
      .then((response) => {
        if (!response.ok) throw new Error("Cannot load services.");
        return response.json();
      })
      .then((data: unknown) => {
        if (isCancelled || !Array.isArray(data)) return;

        const normalized = (data as ServicesApiItem[])
          .filter(isValidService)
          .map((item) => ({
            id: item.id,
            slug: toSlug(item.serviceTypeName),
            title: item.serviceTypeName,
            description: item.description,
            items: item.items,
            image: item.imageUrl,
          }));

        setExperiences(normalized);
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
  }, []);

  return { experiences, isLoading };
}
