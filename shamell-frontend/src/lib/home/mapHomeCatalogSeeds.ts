import type { EventCatalogItem } from "@/components/catalog";
import type { Experience } from "@/lib/services/experiencesData";
import { serviceCatalogMediaTypeFromUrl } from "@/lib/services/serviceCatalogMedia";

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

type EventsApiItem = {
  id?: string;
  eventTypeName?: string;
  description?: string;
  items?: string[];
  price?: number | null;
  images?: string[];
  heroImageUrl?: string | null;
  heroMediaType?: string | null;
  heroPosterUrl?: string | null;
  heroPosterUrlMobile?: string | null;
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function isValidService(
  item: ServicesApiItem,
): item is ServicesApiItem & {
  id: string;
  serviceTypeName: string;
  description: string;
  items: string[];
  imageUrl: string;
} {
  return Boolean(
    item.id &&
      item.serviceTypeName &&
      item.description &&
      Array.isArray(item.items) &&
      item.items.length > 0 &&
      typeof item.imageUrl === "string" &&
      item.imageUrl.trim().length > 0,
  );
}

function isValidEvent(
  item: EventsApiItem,
): item is EventsApiItem & {
  id: string;
  eventTypeName: string;
  description: string;
  items: string[];
} {
  return Boolean(
    item.id &&
      item.eventTypeName &&
      item.description &&
      Array.isArray(item.items) &&
      item.items.length > 0,
  );
}

/** Normalize public `/api/v1/services` (or above-fold `services`) into home Experience cards. */
export function mapPublicServicesCatalog(data: unknown): Experience[] {
  if (!Array.isArray(data)) return [];
  return (data as ServicesApiItem[]).filter(isValidService).map((item) => {
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
}

/** Normalize public GENERAL events (or above-fold `generalEvents`) into EventCatalogItem cards. */
export function mapPublicGeneralEventsCatalog(data: unknown): EventCatalogItem[] {
  if (!Array.isArray(data)) return [];
  return (data as EventsApiItem[]).filter(isValidEvent).map((item) => {
    const rawPrice = item.price;
    const priceParsed =
      rawPrice === null || rawPrice === undefined
        ? null
        : typeof rawPrice === "number"
          ? rawPrice
          : Number(rawPrice);
    const imgs = Array.isArray(item.images)
      ? item.images.filter((u) => typeof u === "string" && u.trim())
      : [];
    const heroUrl =
      typeof item.heroImageUrl === "string" && item.heroImageUrl.trim()
        ? item.heroImageUrl.trim()
        : imgs.length > 0
          ? imgs[0]
          : null;
    const explicitMt =
      typeof item.heroMediaType === "string" && item.heroMediaType.trim()
        ? item.heroMediaType.trim().toUpperCase()
        : "";
    const heroMediaType: "IMAGE" | "VIDEO" =
      explicitMt === "VIDEO"
        ? "VIDEO"
        : explicitMt === "IMAGE"
          ? "IMAGE"
          : serviceCatalogMediaTypeFromUrl(heroUrl) === "VIDEO"
            ? "VIDEO"
            : "IMAGE";
    return {
      id: item.id,
      eventTypeName: item.eventTypeName,
      description: item.description,
      eventTypes: item.items,
      price: Number.isFinite(priceParsed as number) ? (priceParsed as number) : null,
      heroImageUrl: heroUrl,
      heroMediaType,
      heroPosterUrl:
        typeof item.heroPosterUrl === "string" ? item.heroPosterUrl : null,
      heroPosterUrlMobile:
        typeof item.heroPosterUrlMobile === "string"
          ? item.heroPosterUrlMobile
          : null,
    };
  });
}
