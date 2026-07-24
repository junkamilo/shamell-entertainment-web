import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { postAdminVenueTablesBulk } from "./postAdminVenueTablesBulk";

describe("postAdminVenueTablesBulk", () => {
  const payload = {
    quantity: 2,
    size: "LARGE" as const,
    includedChairs: 8,
    bundlePrice: 250,
  };

  it("returns created and count on success", async () => {
    const result = await postAdminVenueTablesBulk("token-1", payload);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.result?.count).toBe(2);
    expect(result.result?.created).toHaveLength(2);
  });

  it("sends JSON body with bearer token", async () => {
    let auth: string | null = null;
    let received: unknown = null;
    server.use(
      http.post("*/api/v1/venue-tables/admin/bulk", async ({ request }) => {
        auth = request.headers.get("Authorization");
        received = await request.json();
        return HttpResponse.json({ created: [], count: 0 });
      }),
    );
    await postAdminVenueTablesBulk("token-1", payload);
    expect(auth).toBe("Bearer token-1");
    expect(received).toEqual(payload);
  });

  it("returns null result on error", async () => {
    server.use(
      http.post("*/api/v1/venue-tables/admin/bulk", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );
    const result = await postAdminVenueTablesBulk("token-1", payload);
    expect(result.ok).toBe(false);
    expect(result.status).toBe(500);
    expect(result.result).toBeNull();
  });
});
