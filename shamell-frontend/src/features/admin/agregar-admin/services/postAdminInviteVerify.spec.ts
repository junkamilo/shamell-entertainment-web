import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { makeInviteVerifyPayload } from "../test/fixtures/agregarAdmin.fixture";
import { postAdminInviteVerify } from "./postAdminInviteVerify";

describe("postAdminInviteVerify", () => {
  it("resolves on success", async () => {
    await expect(postAdminInviteVerify(makeInviteVerifyPayload())).resolves.toBeUndefined();
  });

  it("rejects with server message on 400", async () => {
    server.use(
      http.post("*/api/v1/auth/admin/invite/verify", () =>
        HttpResponse.json({ message: "nope" }, { status: 400 }),
      ),
    );
    await expect(postAdminInviteVerify(makeInviteVerifyPayload())).rejects.toThrow(/nope/);
  });

  it("rejects with server message on 500", async () => {
    server.use(
      http.post("*/api/v1/auth/admin/invite/verify", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(postAdminInviteVerify(makeInviteVerifyPayload())).rejects.toThrow(/nope/);
  });
});
