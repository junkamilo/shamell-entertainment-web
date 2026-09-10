import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { EMAIL_VERIFICATION_PURPOSE } from "./emailVerificationConstants";
import { startEmailVerification } from "./startEmailVerification";
import { verifyEmailCode } from "./verifyEmailCode";
import { resendEmailVerification } from "./resendEmailVerification";

describe("email-verification client", () => {
  it("parses start, verify, and resend success bodies", async () => {
    server.use(
      http.post("*/api/v1/email-verification/start", () =>
        HttpResponse.json({
          challengeId: "ch-1",
          emailMasked: "a***@example.com",
          expiresAt: "2026-09-10T18:10:00.000Z",
        }),
      ),
      http.post("*/api/v1/email-verification/verify", () =>
        HttpResponse.json({ verifiedToken: "tok-1" }),
      ),
      http.post("*/api/v1/email-verification/resend", () =>
        HttpResponse.json({
          challengeId: "ch-1",
          emailMasked: "a***@example.com",
          expiresAt: "2026-09-10T18:10:00.000Z",
        }),
      ),
    );

    await expect(
      startEmailVerification({
        purpose: EMAIL_VERIFICATION_PURPOSE.CONCIERGE_INQUIRY,
        email: "ada@example.com",
        recaptchaToken: "test-recaptcha-token-ok-xx",
      }),
    ).resolves.toEqual({
      ok: true,
      challengeId: "ch-1",
      emailMasked: "a***@example.com",
      expiresAt: "2026-09-10T18:10:00.000Z",
    });

    await expect(
      verifyEmailCode({ challengeId: "ch-1", code: "482193" }),
    ).resolves.toEqual({ ok: true, verifiedToken: "tok-1" });

    await expect(resendEmailVerification("ch-1")).resolves.toMatchObject({
      ok: true,
      challengeId: "ch-1",
    });
  });

  it("returns a fallback message when start fails", async () => {
    server.use(
      http.post("*/api/v1/email-verification/start", () =>
        HttpResponse.json({ message: "Could not send the verification code." }, { status: 400 }),
      ),
    );

    await expect(
      startEmailVerification({
        purpose: EMAIL_VERIFICATION_PURPOSE.CONCIERGE_INQUIRY,
        email: "ada@example.com",
        recaptchaToken: "test-recaptcha-token-ok-xx",
      }),
    ).resolves.toEqual({
      ok: false,
      message: "Could not send the verification code.",
    });
  });
});
