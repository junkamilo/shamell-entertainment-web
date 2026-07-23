import { describe, it, expect, vi, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { createAvailabilityClosure } from "./createAvailabilityClosure";
import { makeCreateClosurePayload } from "../test/fixtures/disponibilidad.fixture";

describe("createAvailabilityClosure", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the payload and returns the created closure", async () => {
    let body: unknown = null;
    server.use(
      http.post("*/api/v1/availability/admin/closures", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ id: "new-id", ...(body as Record<string, unknown>) });
      }),
    );
    const payload = makeCreateClosurePayload();
    const result = await createAvailabilityClosure(payload);
    expect(body).toEqual(payload);
    expect(result).toEqual({ id: "new-id", ...payload });
  });

  it("throws the default error message on failure", async () => {
    server.use(
      http.post("*/api/v1/availability/admin/closures", () =>
        HttpResponse.json({}, { status: 400 }),
      ),
    );
    await expect(
      createAvailabilityClosure(makeCreateClosurePayload()),
    ).rejects.toThrow("Could not create closure.");
  });

  it("throws the nest error message when provided", async () => {
    server.use(
      http.post("*/api/v1/availability/admin/closures", () =>
        HttpResponse.json({ message: "Overlaps existing closure" }, { status: 409 }),
      ),
    );
    await expect(
      createAvailabilityClosure(makeCreateClosurePayload()),
    ).rejects.toThrow("Overlaps existing closure");
  });

  it("rejects when the network is offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(
      createAvailabilityClosure(makeCreateClosurePayload()),
    ).rejects.toThrow("offline");
  });
});
