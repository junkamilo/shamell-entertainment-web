import { http, HttpResponse } from "msw";
import {
  makeGalleryCategoriesApiPayload,
  makeGalleryPhotosApiPayload,
} from "../fixtures/gallery.fixture";

/**
 * Public gallery routes only (`/gallery/photos`, `/gallery/categories`).
 * Admin gallery handlers use `/gallery/admin/...` and do not conflict.
 */
export const publicGalleryHandlers = [
  http.get("*/api/v1/gallery/photos", () => {
    return HttpResponse.json(makeGalleryPhotosApiPayload());
  }),

  http.get("*/api/v1/gallery/categories", () => {
    return HttpResponse.json(makeGalleryCategoriesApiPayload());
  }),
];
