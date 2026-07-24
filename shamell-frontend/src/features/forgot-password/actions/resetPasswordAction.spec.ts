import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { resetPasswordAction } from "./resetPasswordAction";
import {
  FIXTURE_NEW_PASSWORD,
  FIXTURE_RESET_TOKEN,
} from "../test/fixtures/uuids.fixture";

describe("resetPasswordAction", () => {
  it("rejects missing token", async () => {
    const result = await resetPasswordAction("  ", FIXTURE_NEW_PASSWORD);
    expect(result).toEqual({
      ok: false,
      message: "Invalid or missing recovery link.",
    });
  });

  it("rejects short password", async () => {
    const result = await resetPasswordAction(FIXTURE_RESET_TOKEN, "short");
    expect(result).toEqual({
      ok: false,
      message: "Password must be at least 8 characters.",
    });
  });

  it("returns success message", async () => {
    const result = await resetPasswordAction(
      FIXTURE_RESET_TOKEN,
      FIXTURE_NEW_PASSWORD,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toMatch(/updated/i);
    }
  });

  it("returns API error message on failure", async () => {
    server.use(
      http.post("*/api/v1/auth/reset-password", () =>
        HttpResponse.json(
          { message: "Token expired" },
          { status: 400 },
        ),
      ),
    );
    const result = await resetPasswordAction(
      FIXTURE_RESET_TOKEN,
      FIXTURE_NEW_PASSWORD,
    );
    expect(result).toEqual({ ok: false, message: "Token expired" });
  });
});
