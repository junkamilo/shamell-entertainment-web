import { inferAboutHeroIsVideo } from "@/lib/aboutHeroMedia";

export type AboutContentItem = {
  title: string;
  paragraph1: string;
  coreValues: string[];
  imageUrl: string | null;
  heroMediaType: "IMAGE" | "VIDEO";
  videoDeliveryUrl: string | null;
  videoPosterUrl: string | null;
};

export const fallbackAboutContent: AboutContentItem = {
  title: "ABOUT SHAMELL",
  paragraph1: [
    "Shamell is a professional Oriental dance artist specializing in luxury performances for private galas, elite social events, and bespoke collaborations. Her work blends cultural depth, technical precision, and visual sophistication to create memorable experiences for discerning audiences.",
    "With a refined creative process and client-first approach, every performance is adapted to the atmosphere, audience, and purpose of the occasion. From intimate celebrations to large productions, Shamell delivers presence, artistry, and impact.",
  ].join("\n"),
  coreValues: [
    "Professionalism",
    "Excellence",
    "Authenticity",
    "Emotional Connection",
    "Luxury",
  ],
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
  if (
    inferAboutHeroIsVideo({
      heroMediaType: payload.heroMediaType as string,
      imageUrl: payload.imageUrl,
    })
  ) {
    return "VIDEO";
  }
  return "IMAGE";
}

/** Normalize API JSON into AboutContentItem (public + admin). */
export function normalizeAboutPayload(data: unknown): AboutContentItem | null {
  if (typeof data !== "object" || data === null) return null;
  const payload = data as Partial<AboutContentItem>;
  if (
    typeof payload.title !== "string" ||
    typeof payload.paragraph1 !== "string" ||
    !Array.isArray(payload.coreValues)
  ) {
    return null;
  }

  const heroMediaType = inferHeroMediaType(payload);
  const imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl : null;
  // The backend always emits delivery URLs for video heroes; no client fallback.
  const videoDeliveryUrl =
    typeof payload.videoDeliveryUrl === "string" && payload.videoDeliveryUrl.trim()
      ? payload.videoDeliveryUrl.trim()
      : null;
  const videoPosterUrl =
    typeof payload.videoPosterUrl === "string" && payload.videoPosterUrl.trim()
      ? payload.videoPosterUrl.trim()
      : null;

  return {
    title: payload.title,
    paragraph1: payload.paragraph1,
    coreValues: payload.coreValues,
    imageUrl,
    heroMediaType,
    videoDeliveryUrl,
    videoPosterUrl,
  };
}
