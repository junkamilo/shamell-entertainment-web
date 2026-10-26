import { describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@test/support/server";
import { makeInvitePayload } from "@test/features/admin/agregar-admin/support/fixtures/agregarAdmin.fixture";
import { postAdminInvite } from "@/features/admin/agregar-admin/services/postAdminInvite";

vi.mock("@/features/admin/agregar-admin/lib/agregarAdminAuth", () => ({
  getAgregarAdminAuthHeaders: () => ({
    "Content-Type": "application/json",
    Authorization: "Bearer tok",
  }),
}));

describe("postAdminInvite", () => {
  it("resolves on success", async () => {
    await expect(postAdminInvite(makeInvitePayload())).resolves.toBeUndefined();
  });

  it("rejects with server message on 500", async () => {
    server.use(
      http.post("*/api/v1/auth/admin/invite", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(postAdminInvite(makeInvitePayload())).rejects.toThrow(/nope/);
  });
});
