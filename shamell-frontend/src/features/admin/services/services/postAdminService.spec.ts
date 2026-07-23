import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { postAdminService } from "./postAdminService";

describe("postAdminService", () => {
  it("resolves on success", async () => {
    await expect(postAdminService("token-1", new FormData())).resolves.toBeUndefined();
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.post("*/api/v1/services/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(postAdminService("token-1", new FormData())).rejects.toThrow(/nope/);
  });
});
