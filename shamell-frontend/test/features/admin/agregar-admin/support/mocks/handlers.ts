import { http, HttpResponse } from "msw";

export const agregarAdminHandlers = [
  http.post("*/api/v1/auth/admin/invite", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      fullName?: string;
    };
    if (!body.email?.trim() || !body.fullName?.trim()) {
      return HttpResponse.json(
        { message: "Email and full name are required." },
        { status: 400 },
      );
    }
    return HttpResponse.json({ ok: true });
  }),

  http.post("*/api/v1/auth/admin/invite/verify", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      code?: string;
      password?: string;
    };
    if (!body.email?.trim() || body.code !== "123456" || !body.password) {
      return HttpResponse.json(
        { message: "Wrong or expired code." },
        { status: 400 },
      );
    }
    return HttpResponse.json({ ok: true });
  }),
];
