import { describe, expect, it, vi } from "vitest";
import { postAdminInvite } from "@/features/admin/agregar-admin/services/postAdminInvite";
import { postAdminInviteVerify } from "@/features/admin/agregar-admin/services/postAdminInviteVerify";
import {
  makeInvitePayload,
  makeInviteVerifyPayload,
} from "@test/features/admin/agregar-admin/support/fixtures/agregarAdmin.fixture";
import { FIXTURE_ADMIN_EMAIL } from "@test/features/admin/agregar-admin/support/fixtures/uuids.fixture";
import { createMockAgregarAdminPageState } from "@test/features/admin/agregar-admin/support/helpers/mockAgregarAdminPage";

vi.mock("@/features/admin/agregar-admin/lib/agregarAdminAuth", () => ({
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
