"use client";

import { useEffect, useState } from "react";
import type { Experience } from "@/lib/experiencesData";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/serviceCatalogMedia";

type ServicesApiItem = {
  id?: string;
  serviceTypeName?: string;
  description?: string;
  items?: string[];
  imageUrl?: string | null;
  heroMediaType?: string | null;
  heroPosterUrl?: string | null;
  heroPosterUrlMobile?: string | null;
  contactInquiryCode?: string | null;
};

type ValidServiceApiItem = Required<Pick<ServicesApiItem, "id" | "serviceTypeName" | "description" | "items">> & {
  imageUrl: string;
} & Pick<ServicesApiItem, "contactInquiryCode" | "heroMediaType" | "heroPosterUrl" | "heroPosterUrlMobile">;

const isValidService = (item: ServicesApiItem): item is ValidServiceApiItem =>
  Boolean(
    item.id &&
      item.serviceTypeName &&
      item.description &&
      Array.isArray(item.items) &&
      item.items.length > 0 &&
      typeof item.imageUrl === "string" &&
      item.imageUrl.trim().length > 0,
  );

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function useExperiences(enabled: boolean = true) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
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
          .map((item) => {
            const url = item.imageUrl.trim();
            const explicit =
              typeof item.heroMediaType === "string" && item.heroMediaType.trim()
                ? item.heroMediaType.trim().toUpperCase()
                : "";
            const heroMediaType: "IMAGE" | "VIDEO" =
              explicit === "VIDEO"
                ? "VIDEO"
                : explicit === "IMAGE"
                  ? "IMAGE"
                  : serviceCatalogMediaTypeFromUrl(url) === "VIDEO"
                    ? "VIDEO"
                    : "IMAGE";
            return {
              id: item.id,
              slug: toSlug(item.serviceTypeName),
              title: item.serviceTypeName,
              description: item.description,
              items: item.items,
              image: heroMediaType === "IMAGE" ? url : "",
              heroMediaType,
              videoUrl: heroMediaType === "VIDEO" ? url : null,
              posterUrl:
                typeof item.heroPosterUrl === "string" ? item.heroPosterUrl : null,
              posterUrlMobile:
                typeof item.heroPosterUrlMobile === "string"
                  ? item.heroPosterUrlMobile
                  : null,
              contactInquiryCode: item.contactInquiryCode ?? null,
            };
          });

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
  }, [enabled]);

  return { experiences, isLoading };
}
