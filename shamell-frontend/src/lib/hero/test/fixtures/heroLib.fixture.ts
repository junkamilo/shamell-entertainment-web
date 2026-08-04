import type { AboutContentItem } from "@/lib/about/aboutContent";
import type { PublicHeaderPhoto } from "@/lib/header-media/fetchPublicHeaderMedia";
import {
  FIXTURE_ABOUT_IMAGE,
  FIXTURE_ABOUT_POSTER,
  FIXTURE_ABOUT_VIDEO,
  FIXTURE_HEADER_IMAGE,
  FIXTURE_HEADER_IMAGE_MOBILE,
  FIXTURE_HEADER_POSTER,
  FIXTURE_HEADER_POSTER_MOBILE,
} from "./uuids.fixture";

export function makeAboutHeroContent(
  overrides: Partial<AboutContentItem> = {},
): AboutContentItem {
  return {
    title: "ABOUT SHAMELL",
    paragraph1: "Hero fixture copy.",
    coreValues: ["Excellence"],
    imageUrl: FIXTURE_ABOUT_IMAGE,
    heroMediaType: "IMAGE",
    videoDeliveryUrl: null,
    videoPosterUrl: null,
    ...overrides,
  };
}

export function makeAboutHeroVideoContent(
  overrides: Partial<AboutContentItem> = {},
): AboutContentItem {
  return makeAboutHeroContent({
    heroMediaType: "VIDEO",
    imageUrl: null,
    videoDeliveryUrl: FIXTURE_ABOUT_VIDEO,
    videoPosterUrl: FIXTURE_ABOUT_POSTER,
    ...overrides,
  });
}

export function makeHeroHeaderPhoto(
  overrides: Partial<PublicHeaderPhoto> = {},
): PublicHeaderPhoto {
  return {
    id: "hero-slide-1",
    mediaType: "IMAGE",
    imageUrl: FIXTURE_HEADER_IMAGE,
    imageUrlMobile: FIXTURE_HEADER_IMAGE_MOBILE,
    videoDeliveryUrl: null,
    videoPosterUrl: null,
    videoPosterUrlMobile: null,
    ...overrides,
  };
}

export function makeHeroHeaderVideoSlide(
  overrides: Partial<PublicHeaderPhoto> = {},
): PublicHeaderPhoto {
  return makeHeroHeaderPhoto({
    mediaType: "VIDEO",
    imageUrl: null,
    imageUrlMobile: null,
    videoDeliveryUrl: FIXTURE_ABOUT_VIDEO,
    videoPosterUrl: FIXTURE_HEADER_POSTER,
    videoPosterUrlMobile: FIXTURE_HEADER_POSTER_MOBILE,
    ...overrides,
  });
}
