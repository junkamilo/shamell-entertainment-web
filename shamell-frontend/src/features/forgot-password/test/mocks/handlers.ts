import { http, HttpResponse } from "msw";
import {
  makeForgotPasswordSuccessBody,
  makeResetPasswordSuccessBody,
} from "../fixtures/forgotPassword.fixture";

export const forgotPasswordHandlers = [
  http.post("*/api/v1/auth/forgot-password", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { email?: string };
    if (!body.email || !String(body.email).trim()) {
      return HttpResponse.json(
        { message: "Please enter your email address." },
        { status: 400 },
      );
    }
    return HttpResponse.json(makeForgotPasswordSuccessBody());
  }),

  http.post("*/api/v1/auth/reset-password", async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      token?: string;
      newPassword?: string;
    };
    if (!body.token || !String(body.token).trim()) {
      return HttpResponse.json(
        { message: "Invalid or expired recovery token." },
        { status: 400 },
      );
    }
    if (!body.newPassword || String(body.newPassword).length < 8) {
      return HttpResponse.json(
        { message: "Password must be at least 8 characters." },
        { status: 400 },
      );
    }
    return HttpResponse.json(makeResetPasswordSuccessBody());
  }),
];
