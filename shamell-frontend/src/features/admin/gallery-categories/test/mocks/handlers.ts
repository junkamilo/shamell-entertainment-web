import { http, HttpResponse } from "msw";
import { FIXTURE_CATEGORY_ID } from "../fixtures/uuids.fixture";

export const galleryCategoriesHandlers = [
  http.post("*/api/v1/gallery/admin/categories", () => {
    return HttpResponse.json({ id: FIXTURE_CATEGORY_ID });
  }),

  http.patch("*/api/v1/gallery/admin/categories/:id", () => {
    return HttpResponse.json({ ok: true });
  }),
];
