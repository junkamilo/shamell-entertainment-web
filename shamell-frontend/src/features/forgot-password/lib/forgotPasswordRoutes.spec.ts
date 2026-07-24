import { describe, expect, it } from "vitest";
import {
  FORGOT_PASSWORD_PATH,
  RESET_PASSWORD_PATH,
  buildResetPasswordHref,
} from "./forgotPasswordRoutes";
import { FIXTURE_RESET_TOKEN } from "../test/fixtures/uuids.fixture";

describe("forgotPasswordRoutes", () => {
  it("exports public recovery paths", () => {
    expect(FORGOT_PASSWORD_PATH).toBe("/forgot-password");
    expect(RESET_PASSWORD_PATH).toBe("/forgot-password/reset");
  });

  it("builds reset href with token query", () => {
    expect(buildResetPasswordHref(FIXTURE_RESET_TOKEN)).toBe(
      `${RESET_PASSWORD_PATH}?token=${encodeURIComponent(FIXTURE_RESET_TOKEN)}`,
    );
  });
});
