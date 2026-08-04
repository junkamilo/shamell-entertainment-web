import type { PublicHeaderPhoto } from "../../fetchPublicHeaderMedia";
import type {
  AdminHeaderTextRow,
  HeaderTextContent,
} from "../../headerTextTypes";
import {
  FIXTURE_HEADER_HEADLINE,
  FIXTURE_HEADER_IMAGE,
  FIXTURE_HEADER_PHOTO_ID,
  FIXTURE_HEADER_TEXT_ID,
  FIXTURE_HEADER_VIDEO,
} from "./uuids.fixture";

export function makePublicHeaderPhoto(
  overrides: Partial<PublicHeaderPhoto> = {},
): PublicHeaderPhoto {
  return {
    id: FIXTURE_HEADER_PHOTO_ID,
    mediaType: "IMAGE",
    imageUrl: FIXTURE_HEADER_IMAGE,
    imageUrlMobile: null,
    videoDeliveryUrl: null,
    videoPosterUrl: null,
    videoPosterUrlMobile: null,
    focalX: 50,
    focalY: 40,
    ...overrides,
  };
}

export function makePublicHeaderVideoPhoto(
  overrides: Partial<PublicHeaderPhoto> = {},
): PublicHeaderPhoto {
  return makePublicHeaderPhoto({
    mediaType: "VIDEO",
    imageUrl: null,
    videoDeliveryUrl: FIXTURE_HEADER_VIDEO,
    videoPosterUrl: FIXTURE_HEADER_IMAGE,
    ...overrides,
  });
}

export function makeHeaderTextContent(
  overrides: Partial<HeaderTextContent> = {},
): HeaderTextContent {
  return {
    headline: FIXTURE_HEADER_HEADLINE,
    headlineFont: "brand",
    headlineColor: "#c5a55a",
    tagline: "Fixture tagline",
    taglineFont: "elegant",
    taglineColor: "#f5e6b8",
    quote: "Fixture quote",
    quoteFont: "script",
    quoteColor: "#c5a55a",
    ...overrides,
  };
}

export function makeAdminHeaderTextRow(
  overrides: Partial<AdminHeaderTextRow> = {},
): AdminHeaderTextRow {
  return {
    id: FIXTURE_HEADER_TEXT_ID,
    ...makeHeaderTextContent(),
    isActive: true,
    updatedAt: "2030-01-01T00:00:00.000Z",
    ...overrides,
  };
}

export function makeHeaderMediaApiPayload(
  items: PublicHeaderPhoto[] = [makePublicHeaderPhoto()],
) {
  return items;
}
