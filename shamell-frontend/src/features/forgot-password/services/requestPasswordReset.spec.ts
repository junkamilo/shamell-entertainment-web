import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { requestPasswordReset } from "./requestPasswordReset";
import { FIXTURE_USER_EMAIL } from "../test/fixtures/uuids.fixture";

describe("requestPasswordReset", () => {
  it("posts email and returns ok response", async () => {
    const response = await requestPasswordReset(FIXTURE_USER_EMAIL);
    expect(response.ok).toBe(true);
    const body = (await response.json()) as { message?: string; resetLink?: string };
    expect(body.message).toBeTruthy();
    expect(body.resetLink).toContain("token=");
  });

  it("sends JSON body with email", async () => {
    let payload: unknown = null;
    server.use(
      http.post("*/api/v1/auth/forgot-password", async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({ message: "ok" });
      }),
    );
    await requestPasswordReset(FIXTURE_USER_EMAIL);
    expect(payload).toEqual({ email: FIXTURE_USER_EMAIL });
  });

  it("returns non-ok response on 500", async () => {
    server.use(
      http.post("*/api/v1/auth/forgot-password", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    const response = await requestPasswordReset(FIXTURE_USER_EMAIL);
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
  });
});
