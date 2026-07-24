import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { postAdminOccasionType } from "./postAdminOccasionType";

describe("postAdminOccasionType", () => {
  it("creates successfully", async () => {
    await expect(
      postAdminOccasionType("token-1", { name: "Birthday" }),
    ).resolves.toBeUndefined();
  });

  it("sends JSON body with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    server.use(
      http.post("*/api/v1/events/occasions/admin", async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        return HttpResponse.json({ ok: true });
      }),
    );
    await postAdminOccasionType("token-1", { name: "Birthday" });
    expect(auth).toBe("Bearer token-1");
    expect(received).toEqual({ name: "Birthday" });
  });

  it("throws on 500 with message", async () => {
    server.use(
      http.post("*/api/v1/events/occasions/admin", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    await expect(
      postAdminOccasionType("token-1", { name: "Birthday" }),
    ).rejects.toThrow(/nope/);
  });
});
