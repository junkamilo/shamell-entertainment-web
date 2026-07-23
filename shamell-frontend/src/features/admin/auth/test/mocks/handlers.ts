import { http, HttpResponse } from "msw";
import { makeAdminLoginSuccessResponse } from "../fixtures/auth.fixture";
import {
  FIXTURE_ADMIN_EMAIL,
  FIXTURE_ADMIN_PASSWORD,
} from "../fixtures/uuids.fixture";

export const authHandlers = [
  http.post("*/api/v1/auth/admin/login", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      password?: string;
    };
    if (
      body.email === FIXTURE_ADMIN_EMAIL &&
      body.password === FIXTURE_ADMIN_PASSWORD
    ) {
      return HttpResponse.json(makeAdminLoginSuccessResponse());
    }
    return HttpResponse.json(
      { message: "Invalid admin credentials." },
      { status: 401 },
    );
  }),
];
