import { http, HttpResponse } from "msw";
import {
  makeAdminHeaderTextRow,
  makeHeaderPhotosApiPayload,
} from "../fixtures/headerMedia.fixture";
import { FIXTURE_HEADER_PHOTO_ID } from "../fixtures/uuids.fixture";

export const headerMediaHandlers = [
  http.get("*/api/v1/header-media/admin", () => {
    return HttpResponse.json(makeHeaderPhotosApiPayload());
  }),

  http.post("*/api/v1/header-media/admin/photos", () => {
    return HttpResponse.json({ ok: true, id: FIXTURE_HEADER_PHOTO_ID });
  }),

  http.patch("*/api/v1/header-media/admin/photos/:id/focal", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.patch("*/api/v1/header-media/admin/photos/:id", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.delete("*/api/v1/header-media/admin/photos/:id", () => {
    return HttpResponse.json({ ok: true });
  }),

  http.get("*/api/v1/header-text/admin", () => {
    return HttpResponse.json(makeAdminHeaderTextRow());
  }),

  http.patch("*/api/v1/header-text/admin", () => {
    return HttpResponse.json(makeAdminHeaderTextRow());
  }),
];
