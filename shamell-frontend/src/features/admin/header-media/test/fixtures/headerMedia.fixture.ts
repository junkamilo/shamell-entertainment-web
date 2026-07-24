import { DEFAULT_HEADER_TEXT } from "@/lib/headerTextTypes";
import type { AdminHeaderTextRow } from "@/lib/headerTextTypes";
import type { HeaderPhoto } from "../../types/headerMedia.types";
import {
  FIXTURE_HEADER_PHOTO_ID,
  FIXTURE_HEADER_PHOTO_ID_2,
  FIXTURE_HEADER_TEXT_ID,
} from "./uuids.fixture";

export function makeHeaderPhoto(overrides: Partial<HeaderPhoto> = {}): HeaderPhoto {
  return {
    id: FIXTURE_HEADER_PHOTO_ID,
    imageUrl: "https://cdn.example.com/header/photo.jpg",
    mediaType: "IMAGE",
    focalX: 50,
    focalY: 35,
    focalMobileX: 50,
    focalMobileY: 35,
    isActive: true,
    createdAt: "2026-07-20T12:00:00.000Z",
    updatedAt: "2026-07-20T12:00:00.000Z",
    ...overrides,
  };
}

export function makeHeaderPhotosApiPayload(
  items: HeaderPhoto[] = [
    makeHeaderPhoto(),
    makeHeaderPhoto({
      id: FIXTURE_HEADER_PHOTO_ID_2,
      imageUrl: "https://cdn.example.com/header/video.mp4",
      mediaType: "VIDEO",
      isActive: false,
    }),
  ],
) {
  return items;
}

export function makeAdminHeaderTextRow(
  overrides: Partial<AdminHeaderTextRow> = {},
): AdminHeaderTextRow {
  return {
    id: FIXTURE_HEADER_TEXT_ID,
    ...DEFAULT_HEADER_TEXT,
    isActive: true,
    updatedAt: "2026-07-20T12:00:00.000Z",
    ...overrides,
  };
}
