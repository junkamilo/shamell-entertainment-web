import {
  fallbackAboutContent,
  normalizeAboutPayload,
} from "@/lib/about/aboutContent";
import type { AboutContentItem } from "@/lib/about/aboutContent";
import { fetchPublicAbout } from "@/lib/about/fetchPublicAbout";
import type { EventCatalogItem } from "@/components/catalog";
import {
  fetchPublicHeaderMedia,
  normalizeHeaderPhotos,
} from "@/lib/header-media/fetchPublicHeaderMedia";
import type { PublicHeaderPhoto } from "@/lib/header-media/fetchPublicHeaderMedia";
import { mapHeaderTextFromApi } from "@/lib/header-media/headerTextStyleTokens";
import { DEFAULT_HEADER_TEXT } from "@/lib/header-media/headerTextTypes";
import type { HeaderTextContent } from "@/lib/header-media/headerTextTypes";
import {
  defaultOnComingSettings,
  normalizeOnComingSettings,
} from "@/lib/on-coming-events/onComingSettings";
import type { OnComingEventsPromo } from "@/lib/on-coming-events/onComingSettings";
import { mapPublicUpcomingHubEvents } from "@/lib/on-coming-events/mapPublicUpcomingHubEvents";
import type { OnComingEventHubCardItem } from "@/features/on-coming-events/components/OnComingEventHubCard";
import type { Experience } from "@/lib/services/experiencesData";
import {
  mapPublicGeneralEventsCatalog,
  mapPublicServicesCatalog,
} from "@/lib/home/mapHomeCatalogSeeds";

const HOME_ABOVE_FOLD_REVALIDATE_SEC = 180;

export type HomeAboveFold = {
  about: AboutContentItem;
  headerPhotos: PublicHeaderPhoto[];
  headerText: HeaderTextContent;
  onComingSettings: OnComingEventsPromo;
  upcomingEvents: OnComingEventHubCardItem[];
  services: Experience[];
  generalEvents: EventCatalogItem[];
};

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:3001";
}

/** Falls back to the individual SSR fetches if the aggregated endpoint fails. */
async function legacyAboveFold(): Promise<HomeAboveFold> {
  const base = apiBaseUrl();
  const [
    about,
    headerPhotos,
    headerText,
    onComingSettings,
    upcomingEvents,
    servicesRaw,
    generalEventsRaw,
  ] = await Promise.all([
    fetchPublicAbout(),
    fetchPublicHeaderMedia(),
    fetch(`${base}/api/v1/header-text`, { next: { revalidate: 300 } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => (d ? mapHeaderTextFromApi(d) : DEFAULT_HEADER_TEXT))
      .catch(() => DEFAULT_HEADER_TEXT),
    fetch(`${base}/api/v1/on-coming-events/settings`, {
      next: { revalidate: 120 },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => normalizeOnComingSettings(d))
      .catch(() => defaultOnComingSettings),
    fetch(`${base}/api/v1/events?publicSection=UPCOMING_EVENTS`, {
      next: { revalidate: 120 },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => mapPublicUpcomingHubEvents(d))
      .catch(() => [] as OnComingEventHubCardItem[]),
    fetch(`${base}/api/v1/services`, { next: { revalidate: 180 } })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    fetch(`${base}/api/v1/events?publicSection=GENERAL`, {
      next: { revalidate: 180 },
    })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
  ]);
  return {
    about,
    headerPhotos,
    headerText,
    onComingSettings,
    upcomingEvents: onComingSettings.clientEnabled ? upcomingEvents : [],
    services: mapPublicServicesCatalog(servicesRaw),
    generalEvents: mapPublicGeneralEventsCatalog(generalEventsRaw),
  };
}

export async function fetchHomeAboveFold(): Promise<HomeAboveFold> {
  try {
    const response = await fetch(`${apiBaseUrl()}/api/v1/home/above-fold`, {
      next: { revalidate: HOME_ABOVE_FOLD_REVALIDATE_SEC, tags: ["home-above-fold"] },
    });
    if (!response.ok) return legacyAboveFold();
    const data = (await response.json().catch(() => null)) as {
      about?: unknown;
      headerPhotos?: unknown;
      headerText?: unknown;
      onComingSettings?: unknown;
      upcomingEvents?: unknown;
      services?: unknown;
      generalEvents?: unknown;
    } | null;
    if (!data) return legacyAboveFold();
    const onComingSettings = normalizeOnComingSettings(data.onComingSettings);
    const upcomingEvents = Array.isArray(data.upcomingEvents)
      ? mapPublicUpcomingHubEvents(data.upcomingEvents)
      : [];
    return {
      about: normalizeAboutPayload(data.about) ?? fallbackAboutContent,
      headerPhotos: normalizeHeaderPhotos(data.headerPhotos),
      headerText: data.headerText
        ? mapHeaderTextFromApi(data.headerText)
        : DEFAULT_HEADER_TEXT,
      onComingSettings,
      upcomingEvents: onComingSettings.clientEnabled ? upcomingEvents : [],
      services: mapPublicServicesCatalog(data.services),
      generalEvents: mapPublicGeneralEventsCatalog(data.generalEvents),
    };
  } catch {
    return legacyAboveFold();
  }
}
