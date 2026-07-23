import { describe, it, expect, vi, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { putWeeklyAvailability } from "./putWeeklyAvailability";
import { defaultWeekly } from "../lib/disponibilidadConstants";
import { makeAdminAvailabilitySnapshot } from "../test/fixtures/disponibilidad.fixture";

describe("putWeeklyAvailability", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends a { slots } body and returns the updated snapshot", async () => {
    let body: unknown = null;
    server.use(
      http.put("*/api/v1/availability/admin/weekly", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(makeAdminAvailabilitySnapshot());
      }),
    );
    const slots = defaultWeekly();
    const result = await putWeeklyAvailability(slots);
    expect(body).toEqual({ slots });
    expect(result).toEqual(makeAdminAvailabilitySnapshot());
  });

  it("works without a token (getDisponibilidadAuthHeaders omits Authorization)", async () => {
    let auth: string | null | undefined;
    server.use(
      http.put("*/api/v1/availability/admin/weekly", ({ request }) => {
        auth = request.headers.get("Authorization");
        return HttpResponse.json(makeAdminAvailabilitySnapshot());
      }),
    );
    await putWeeklyAvailability(defaultWeekly());
    expect(auth).toBeNull();
  });

  it("throws the default error message when the save fails", async () => {
    server.use(
      http.put("*/api/v1/availability/admin/weekly", () =>
        HttpResponse.json({}, { status: 400 }),
      ),
    );
    await expect(putWeeklyAvailability(defaultWeekly())).rejects.toThrow("Could not save.");
  });

  it("throws the nest error message when provided", async () => {
    server.use(
      http.put("*/api/v1/availability/admin/weekly", () =>
        HttpResponse.json({ message: "Invalid slots" }, { status: 400 }),
      ),
    );
    await expect(putWeeklyAvailability(defaultWeekly())).rejects.toThrow("Invalid slots");
  });

  it("rejects when the network is offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(putWeeklyAvailability(defaultWeekly())).rejects.toThrow("offline");
  });
});
