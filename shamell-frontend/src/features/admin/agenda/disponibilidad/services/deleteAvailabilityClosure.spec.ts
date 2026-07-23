import { describe, it, expect, vi, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { deleteAvailabilityClosure } from "./deleteAvailabilityClosure";
import { FIXTURE_CLOSURE_SPECIFIC_ID } from "../test/fixtures/uuids.fixture";

describe("deleteAvailabilityClosure", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves on a 204 success response", async () => {
    await expect(
      deleteAvailabilityClosure(FIXTURE_CLOSURE_SPECIFIC_ID),
    ).resolves.toBeUndefined();
  });

  it("includes the closure id in the request URL", async () => {
    let receivedId = "";
    server.use(
      http.delete("*/api/v1/availability/admin/closures/:id", ({ params }) => {
        receivedId = String(params.id);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    await deleteAvailabilityClosure("some-closure-id");
    expect(receivedId).toBe("some-closure-id");
  });

  it("throws the default error message on failure", async () => {
    server.use(
      http.delete("*/api/v1/availability/admin/closures/:id", () =>
        HttpResponse.json({}, { status: 400 }),
      ),
    );
    await expect(deleteAvailabilityClosure("id-1")).rejects.toThrow("Could not delete.");
  });

  it("throws the nest error message when provided", async () => {
    server.use(
      http.delete("*/api/v1/availability/admin/closures/:id", () =>
        HttpResponse.json({ message: "Closure not found" }, { status: 404 }),
      ),
    );
    await expect(deleteAvailabilityClosure("id-1")).rejects.toThrow("Closure not found");
  });

  it("rejects when the network is offline", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(deleteAvailabilityClosure("id-1")).rejects.toThrow("offline");
  });
});
