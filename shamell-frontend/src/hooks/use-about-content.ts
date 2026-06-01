"use client";

import { useEffect, useState } from "react";
import { getPublicApiBaseUrl } from "@/app/contacto/lib/apiBaseUrl";
import { inferAboutHeroIsVideo } from "@/lib/aboutHeroMedia";
import {
  buildAboutHeroVideoPosterUrl,
  buildAboutHeroVideoStreamUrl,
} from "@/lib/aboutHeroVideoDelivery";

export type AboutContentItem = {
  title: string;
  paragraph1: string;
  coreValues: string[];
  imageUrl: string | null;
  heroMediaType: "IMAGE" | "VIDEO";
  videoDeliveryUrl: string | null;
  videoPosterUrl: string | null;
};

const fallbackAboutContent: AboutContentItem = {
  title: "ABOUT SHAMELL",
  paragraph1: [
    "Shamell is a professional Oriental dance artist specializing in luxury performances for private galas, elite social events, and bespoke collaborations. Her work blends cultural depth, technical precision, and visual sophistication to create memorable experiences for discerning audiences.",
    "With a refined creative process and client-first approach, every performance is adapted to the atmosphere, audience, and purpose of the occasion. From intimate celebrations to large productions, Shamell delivers presence, artistry, and impact.",
  ].join("\n"),
  coreValues: ["Professionalism", "Excellence", "Authenticity", "Emotional Connection", "Luxury"],
  imageUrl: null,
  heroMediaType: "IMAGE",
  videoDeliveryUrl: null,
  videoPosterUrl: null,
};

function inferHeroMediaType(payload: {
  heroMediaType?: unknown;
  imageUrl?: string | null;
}): "IMAGE" | "VIDEO" {
  if (payload.heroMediaType === "IMAGE") return "IMAGE";
  if (inferAboutHeroIsVideo({ heroMediaType: payload.heroMediaType as string, imageUrl: payload.imageUrl })) {
    return "VIDEO";
  }
  return "IMAGE";
}

export function useAboutContent() {
  const [about, setAbout] = useState<AboutContentItem>(fallbackAboutContent);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    const apiBaseUrl = getPublicApiBaseUrl();

    fetch(`${apiBaseUrl}/api/v1/about`, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Cannot load about content.");
        return response.json();
      })
      .then((data: unknown) => {
        if (isCancelled || typeof data !== "object" || data === null) return;
        const payload = data as Partial<AboutContentItem>;
        if (typeof payload.title !== "string" || typeof payload.paragraph1 !== "string" || !Array.isArray(payload.coreValues)) {
          return;
        }

        const heroMediaType = inferHeroMediaType(payload);
        const imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl : null;
        const videoDeliveryUrl =
          typeof payload.videoDeliveryUrl === "string"
            ? payload.videoDeliveryUrl
            : heroMediaType === "VIDEO"
              ? buildAboutHeroVideoStreamUrl(imageUrl)
              : null;
        const videoPosterUrl =
          typeof payload.videoPosterUrl === "string"
            ? payload.videoPosterUrl
            : heroMediaType === "VIDEO"
              ? buildAboutHeroVideoPosterUrl(imageUrl)
              : null;

        setAbout({
          title: payload.title,
          paragraph1: payload.paragraph1,
          coreValues: payload.coreValues,
          imageUrl,
          heroMediaType,
          videoDeliveryUrl,
          videoPosterUrl,
        });
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
  }, []);

  useEffect(() => {
    if (!about.videoPosterUrl) return;
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.as = "image";
    link.href = about.videoPosterUrl;
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [about.videoPosterUrl]);

  return { about, isLoading };
}
