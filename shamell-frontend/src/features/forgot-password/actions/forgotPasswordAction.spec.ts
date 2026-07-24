import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { forgotPasswordAction } from "./forgotPasswordAction";
import { FIXTURE_USER_EMAIL } from "../test/fixtures/uuids.fixture";

describe("forgotPasswordAction", () => {
  it("rejects empty email", async () => {
    const result = await forgotPasswordAction("   ");
    expect(result).toEqual({
      ok: false,
      message: "Please enter your email address.",
    });
  });

  it("returns success message and resetLink from API", async () => {
    const result = await forgotPasswordAction(FIXTURE_USER_EMAIL);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toBeTruthy();
      expect(result.resetLink).toContain("token=");
    }
  });

  it("returns API error message on failure", async () => {
    server.use(
      http.post("*/api/v1/auth/forgot-password", () =>
        HttpResponse.json({ message: "Too many requests" }, { status: 429 }),
      ),
    );
    const result = await forgotPasswordAction(FIXTURE_USER_EMAIL);
    expect(result).toEqual({ ok: false, message: "Too many requests" });
  });

  it("trims email before sending", async () => {
    let email: string | undefined;
    server.use(
      http.post("*/api/v1/auth/forgot-password", async ({ request }) => {
        const body = (await request.json()) as { email?: string };
        email = body.email;
        return HttpResponse.json({ message: "sent" });
      }),
    );
    await forgotPasswordAction(`  ${FIXTURE_USER_EMAIL}  `);
    expect(email).toBe(FIXTURE_USER_EMAIL);
  });
});
