import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { submitPasswordReset } from "./submitPasswordReset";
import {
  FIXTURE_NEW_PASSWORD,
  FIXTURE_RESET_TOKEN,
} from "../test/fixtures/uuids.fixture";

describe("submitPasswordReset", () => {
  it("posts token and new password", async () => {
    const response = await submitPasswordReset(
      FIXTURE_RESET_TOKEN,
      FIXTURE_NEW_PASSWORD,
    );
    expect(response.ok).toBe(true);
    const body = (await response.json()) as { message?: string };
    expect(body.message).toMatch(/updated/i);
  });

  it("sends JSON body with token and newPassword", async () => {
    let payload: unknown = null;
    server.use(
      http.post("*/api/v1/auth/reset-password", async ({ request }) => {
        payload = await request.json();
        return HttpResponse.json({ message: "ok" });
      }),
    );
    await submitPasswordReset(FIXTURE_RESET_TOKEN, FIXTURE_NEW_PASSWORD);
    expect(payload).toEqual({
      token: FIXTURE_RESET_TOKEN,
      newPassword: FIXTURE_NEW_PASSWORD,
    });
  });

  it("returns non-ok response on invalid token", async () => {
    server.use(
      http.post("*/api/v1/auth/reset-password", () =>
        HttpResponse.json(
          { message: "Invalid or expired recovery token." },
          { status: 400 },
        ),
      ),
    );
    const response = await submitPasswordReset("bad", FIXTURE_NEW_PASSWORD);
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
  });
});
