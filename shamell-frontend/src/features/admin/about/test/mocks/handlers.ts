import { http, HttpResponse } from "msw";
import { makeAdminAboutRow } from "../fixtures/about.fixture";

export const aboutHandlers = [
  http.get("*/api/v1/about/admin", () => {
    return HttpResponse.json(makeAdminAboutRow());
  }),
  http.patch("*/api/v1/about/admin", async ({ request }) => {
    const form = await request.formData();
    const title = String(form.get("title") ?? "");
    const paragraph1 = String(form.get("paragraph1") ?? "");
    const coreValues = form.getAll("coreValues").map((v) => String(v));
    return HttpResponse.json(
      makeAdminAboutRow({
        title,
        paragraph1,
        coreValues,
      }),
    );
  }),
  http.delete("*/api/v1/about/admin/media", () => {
    return HttpResponse.json({ ok: true });
  }),
];
