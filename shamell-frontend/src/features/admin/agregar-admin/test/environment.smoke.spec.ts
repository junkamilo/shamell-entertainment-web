import { describe, expect, it, vi } from "vitest";
import { postAdminInvite } from "../services/postAdminInvite";
import { postAdminInviteVerify } from "../services/postAdminInviteVerify";
import {
  makeInvitePayload,
  makeInviteVerifyPayload,
} from "./fixtures/agregarAdmin.fixture";
import { FIXTURE_ADMIN_EMAIL } from "./fixtures/uuids.fixture";
import { createMockAgregarAdminPageState } from "./helpers/mockAgregarAdminPage";

vi.mock("../lib/agregarAdminAuth", () => ({
  getAgregarAdminBearerToken: () => "token-1",
  getAgregarAdminAuthHeaders: () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer token-1",
  }),
}));

describe("agregar-admin test environment", () => {
  it("exposes usable fixtures and page mock", () => {
    expect(makeInvitePayload().email).toBe(FIXTURE_ADMIN_EMAIL);
    expect(makeInviteVerifyPayload().code).toBe("123456");

    const page = createMockAgregarAdminPageState({
      form: { phase: 2 },
    });
    expect(page.form.phase).toBe(2);
    page.sendVerificationCode(true);
    expect(page.sendVerificationCode).toHaveBeenCalledWith(true);
  });

  it("serves invite and verify via MSW", async () => {
    await expect(postAdminInvite(makeInvitePayload())).resolves.toBeUndefined();
    await expect(
      postAdminInviteVerify(makeInviteVerifyPayload()),
    ).resolves.toBeUndefined();
  });
});
