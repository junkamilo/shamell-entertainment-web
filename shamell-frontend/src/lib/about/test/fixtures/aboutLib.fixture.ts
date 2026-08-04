import type { AboutContentItem } from "../../aboutContent";
import {
  FIXTURE_ABOUT_IMAGE,
  FIXTURE_ABOUT_POSTER,
  FIXTURE_ABOUT_TITLE,
  FIXTURE_ABOUT_VIDEO,
} from "./uuids.fixture";

export function makeAboutContentItem(
  overrides: Partial<AboutContentItem> = {},
): AboutContentItem {
  return {
    title: FIXTURE_ABOUT_TITLE,
    paragraph1: "Fixture paragraph one.\nFixture paragraph two.",
    coreValues: ["Excellence", "Luxury", "Authenticity"],
    imageUrl: FIXTURE_ABOUT_IMAGE,
    heroMediaType: "IMAGE",
    videoDeliveryUrl: null,
    videoPosterUrl: null,
    ...overrides,
  };
}

export function makeAboutVideoContentItem(
  overrides: Partial<AboutContentItem> = {},
): AboutContentItem {
  return makeAboutContentItem({
    heroMediaType: "VIDEO",
    imageUrl: null,
    videoDeliveryUrl: FIXTURE_ABOUT_VIDEO,
    videoPosterUrl: FIXTURE_ABOUT_POSTER,
    ...overrides,
  });
}

export function makeAboutApiPayload(
  overrides: Record<string, unknown> = {},
) {
  return {
    title: FIXTURE_ABOUT_TITLE,
    paragraph1: "API about body.",
    coreValues: ["Professionalism"],
    imageUrl: FIXTURE_ABOUT_IMAGE,
    heroMediaType: "IMAGE",
    videoDeliveryUrl: null,
    videoPosterUrl: null,
    ...overrides,
  };
}
