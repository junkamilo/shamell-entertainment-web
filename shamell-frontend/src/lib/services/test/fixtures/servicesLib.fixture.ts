import type { Experience } from "../../experiencesData";
import {
  FIXTURE_CATALOG_IMAGE_URL,
  FIXTURE_EXPERIENCE_ID,
  FIXTURE_EXPERIENCE_SLUG,
  FIXTURE_EXPERIENCE_TITLE,
} from "./uuids.fixture";

/** Lightweight stand-in for StaticImageData in page mocks (not for real rendering). */
export function makeStaticImageStub(src = "/stub-experience.jpg") {
  return {
    src,
    height: 800,
    width: 600,
    blurDataURL: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
  };
}

export function makeExperienceFixture(
  overrides: Partial<Experience> = {},
): Experience {
  return {
    id: FIXTURE_EXPERIENCE_ID,
    slug: FIXTURE_EXPERIENCE_SLUG,
    title: FIXTURE_EXPERIENCE_TITLE,
    description: "High-impact fire performance for approved venues.",
    items: ["Venue approval required", "Fire extinguisher on standby"],
    image: makeStaticImageStub(FIXTURE_CATALOG_IMAGE_URL) as Experience["image"],
    heroMediaType: "IMAGE",
    videoUrl: null,
    posterUrl: null,
    posterUrlMobile: null,
    contactInquiryCode: "FIRE",
    ...overrides,
  };
}

export function makeVideoExperienceFixture(
  overrides: Partial<Experience> = {},
): Experience {
  return makeExperienceFixture({
    heroMediaType: "VIDEO",
    videoUrl: "https://cdn.example.com/services/fire.mp4",
    posterUrl: FIXTURE_CATALOG_IMAGE_URL,
    ...overrides,
  });
}
