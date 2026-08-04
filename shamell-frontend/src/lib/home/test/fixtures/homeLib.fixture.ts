import type { AboutContentItem } from "@/lib/about/aboutContent";
import type { PublicHeaderPhoto } from "@/lib/header-media/fetchPublicHeaderMedia";
import type { HeaderTextContent } from "@/lib/header-media/headerTextTypes";
import type { OnComingEventsPromo } from "@/lib/on-coming-events/onComingSettings";
import {
  FIXTURE_HOME_ABOUT_TITLE,
  FIXTURE_HOME_EVENT_ID,
  FIXTURE_HOME_EVENT_SLUG,
  FIXTURE_HOME_HEADLINE,
} from "./uuids.fixture";

export function makeHomeAbout(
  overrides: Partial<AboutContentItem> = {},
): AboutContentItem {
  return {
    title: FIXTURE_HOME_ABOUT_TITLE,
    paragraph1: "Home about body.",
    coreValues: ["Excellence"],
    imageUrl: "https://cdn.example.com/home/about.jpg",
    heroMediaType: "IMAGE",
    videoDeliveryUrl: null,
    videoPosterUrl: null,
    ...overrides,
  };
}

export function makeHomeHeaderPhoto(
  overrides: Partial<PublicHeaderPhoto> = {},
): PublicHeaderPhoto {
  return {
    id: "home-header-1",
    mediaType: "IMAGE",
    imageUrl: "https://cdn.example.com/home/header.jpg",
    imageUrlMobile: null,
    videoDeliveryUrl: null,
    videoPosterUrl: null,
    videoPosterUrlMobile: null,
    ...overrides,
  };
}

export function makeHomeHeaderText(
  overrides: Partial<HeaderTextContent> = {},
): HeaderTextContent {
  return {
    headline: FIXTURE_HOME_HEADLINE,
    headlineFont: "brand",
    headlineColor: "#c5a55a",
    tagline: "Home tagline",
    taglineFont: "elegant",
    taglineColor: "#f5e6b8",
    quote: "Home quote",
    quoteFont: "script",
    quoteColor: "#c5a55a",
    ...overrides,
  };
}

export function makeHomeOnComingSettings(
  overrides: Partial<OnComingEventsPromo> = {},
): OnComingEventsPromo {
  return {
    clientEnabled: true,
    promoTitle: "Home Promo",
    promoDescription: "Promo copy",
    promoImageUrl: null,
    reservationEventDate: null,
    reservationOpensAt: null,
    reservationClosesAt: null,
    reservationEventLabel: null,
    reservationTimezone: "America/New_York",
    updatedAt: "2030-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeHomeUpcomingEventApiItem(
  overrides: Record<string, unknown> = {},
) {
  return {
    id: FIXTURE_HOME_EVENT_ID,
    eventTypeName: "Gala Night",
    description: "An elegant upcoming gala with full staging and dance.",
    items: ["Dance set", "Host"],
    slug: FIXTURE_HOME_EVENT_SLUG,
    experienceType: "FIXED_TICKET",
    purchaseMode: "FIXED_TICKET",
    purchasable: true,
    heroImageUrl: "https://cdn.example.com/home/event.jpg",
    heroMediaType: "IMAGE",
    images: ["https://cdn.example.com/home/event.jpg"],
    eventStartsAt: "2030-08-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeHomeAboveFoldApiPayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    about: makeHomeAbout(),
    headerPhotos: [makeHomeHeaderPhoto()],
    headerText: makeHomeHeaderText(),
    onComingSettings: makeHomeOnComingSettings(),
    upcomingEvents: [makeHomeUpcomingEventApiItem()],
    ...overrides,
  };
}
