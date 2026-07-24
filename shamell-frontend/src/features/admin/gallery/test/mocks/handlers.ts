import { http, HttpResponse } from "msw";
import {
  makeGalleryCategoriesApiPayload,
  makeGalleryPhotosApiPayload,
} from "../fixtures/gallery.fixture";
import { FIXTURE_PHOTO_ID } from "../fixtures/uuids.fixture";

export const galleryHandlers = [
  http.get("*/api/v1/gallery/admin/photos", () => {
    return HttpResponse.json(makeGalleryPhotosApiPayload());
  }),

  http.post("*/api/v1/gallery/admin/photos", () => {
    return HttpResponse.json({ items: [{ id: FIXTURE_PHOTO_ID }] });
  }),

  http.patch("*/api/v1/gallery/admin/photos/:id", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.delete("*/api/v1/gallery/admin/photos/:id", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.get("*/api/v1/gallery/admin/categories", () => {
    return HttpResponse.json(makeGalleryCategoriesApiPayload());
  }),
];
