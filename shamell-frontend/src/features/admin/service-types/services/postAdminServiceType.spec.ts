import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { postAdminServiceType } from "./postAdminServiceType";

describe("postAdminServiceType", () => {
  it("creates successfully", async () => {
    await expect(
      postAdminServiceType("token-1", { name: "Performance" }),
    ).resolves.toBeUndefined();
  });

  it("sends JSON body with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    server.use(
      http.post("*/api/v1/services/types/admin", async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    await postAdminServiceType("token-1", { name: "Performance" });
    expect(auth).toBe("Bearer token-1");
    expect(received).toEqual({ name: "Performance" });
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.post("*/api/v1/services/types/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      postAdminServiceType("token-1", { name: "Performance" }),
    ).rejects.toThrow(/nope/);
  });
});
