import {
  fallbackAboutContent,
  normalizeAboutPayload,
} from "@/lib/aboutContent";
import type { AboutContentItem } from "@/lib/aboutContent";
import { fetchPublicAbout } from "@/lib/fetchPublicAbout";
import {
  fetchPublicHeaderMedia,
  normalizeHeaderPhotos,
} from "@/lib/fetchPublicHeaderMedia";
import type { PublicHeaderPhoto } from "@/lib/fetchPublicHeaderMedia";
import { mapHeaderTextFromApi } from "@/lib/headerTextStyleTokens";
import { DEFAULT_HEADER_TEXT } from "@/lib/headerTextTypes";
import type { HeaderTextContent } from "@/lib/headerTextTypes";
import {
  defaultOnComingSettings,
  normalizeOnComingSettings,
} from "@/lib/onComingSettings";
import type { OnComingEventsPromo } from "@/lib/onComingSettings";
import { mapPublicUpcomingHubEvents } from "@/lib/mapPublicUpcomingHubEvents";
import type { OnComingEventHubCardItem } from "@/app/on-coming-events/components/OnComingEventHubCard";

const HOME_ABOVE_FOLD_REVALIDATE_SEC = 180;

export type HomeAboveFold = {
  about: AboutContentItem;
  headerPhotos: PublicHeaderPhoto[];
  headerText: HeaderTextContent;
  onComingSettings: OnComingEventsPromo;
  upcomingEvents: OnComingEventHubCardItem[];
};

function apiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BACKEND_URL?.trim() || "http://localhost:3001";
}

/** Falls back to the individual SSR fetches if the aggregated endpoint fails. */
async function legacyAboveFold(): Promise<HomeAboveFold> {
  const base = apiBaseUrl();
  const [about, headerPhotos, headerText, onComingSettings, upcomingEvents] =
    await Promise.all([
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
    ]);
  return {
    about,
    headerPhotos,
    headerText,
    onComingSettings,
    upcomingEvents: onComingSettings.clientEnabled ? upcomingEvents : [],
  };
}

export async function fetchHomeAboveFold(): Promise<HomeAboveFold> {
  try {
    const response = await fetch(`${apiBaseUrl()}/api/v1/home/above-fold`, {
      next: { revalidate: HOME_ABOVE_FOLD_REVALIDATE_SEC },
    });
    if (!response.ok) return legacyAboveFold();
    const data = (await response.json().catch(() => null)) as {
      about?: unknown;
      headerPhotos?: unknown;
      headerText?: unknown;
      onComingSettings?: unknown;
      upcomingEvents?: unknown;
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
    };
  } catch {
    return legacyAboveFold();
  }
}
