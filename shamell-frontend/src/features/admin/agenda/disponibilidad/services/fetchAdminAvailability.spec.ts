import { describe, it, expect, vi, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchAdminAvailability } from "./fetchAdminAvailability";
import { makeAdminAvailabilitySnapshot } from "../test/fixtures/disponibilidad.fixture";

describe("fetchAdminAvailability", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the availability snapshot on success", async () => {
    const result = await fetchAdminAvailability("token-1");
    expect(result).toEqual(makeAdminAvailabilitySnapshot());
  });

  it("sends the bearer token in the Authorization header", async () => {
    let auth: string | null = null;
    server.use(
      http.get("*/api/v1/availability/admin", ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json(makeAdminAvailabilitySnapshot());
      }),
    );
    await fetchAdminAvailability("secret-token");
    expect(auth).toBe("Bearer secret-token");
  });

  it("throws the nest error message when the request fails", async () => {
    server.use(
      http.get("*/api/v1/availability/admin", () =>
        HttpResponse.json({ message: "Boom" }, { status: 500 }),
      ),
    );
    await expect(fetchAdminAvailability("token-1")).rejects.toThrow("Boom");
  });

  it("falls back to the default error message when the body has no message", async () => {
    server.use(
      http.get("*/api/v1/availability/admin", () => HttpResponse.json({}, { status: 500 })),
    );
    await expect(fetchAdminAvailability("token-1")).rejects.toThrow(
      "Could not load availability.",
    );
  });

  it("rejects when the network is offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Failed to fetch")));
    await expect(fetchAdminAvailability("token-1")).rejects.toThrow("Failed to fetch");
  });
});
