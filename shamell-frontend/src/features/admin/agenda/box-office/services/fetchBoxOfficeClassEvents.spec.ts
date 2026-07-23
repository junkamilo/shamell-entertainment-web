import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/server";
import { fetchBoxOfficeClassEvents } from "./fetchBoxOfficeClassEvents";

const ROUTE = "*/api/v1/upcoming-events/admin/bookable-class-events";

describe("fetchBoxOfficeClassEvents", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns events sorted by name", async () => {
    const result = await fetchBoxOfficeClassEvents("token-1");
    expect(result.ok).toBe(true);
    expect(result.events.map((e) => e.name)).toEqual([
      "Bachata Labs",
      "Salsa Foundations",
    ]);
  });

  it("returns ok:false with the API message on error", async () => {
    server.use(
      http.get(ROUTE, () =>
        HttpResponse.json({ message: "Catalog down" }, { status: 500 }),
      ),
    );
    const result = await fetchBoxOfficeClassEvents("token-1");
    expect(result).toEqual({
      ok: false,
      events: [],
      message: "Catalog down",
    });
  });

  it("returns a default failure message when the error body has none", async () => {
    server.use(http.get(ROUTE, () => HttpResponse.json({}, { status: 500 })));
    const result = await fetchBoxOfficeClassEvents("token-1");
    expect(result).toEqual({
      ok: false,
      events: [],
      message: "Could not load class events.",
    });
  });

  it("returns ok:false when the success body is not an object", async () => {
    server.use(http.get(ROUTE, () => HttpResponse.json(null)));
    const result = await fetchBoxOfficeClassEvents("token-1");
    expect(result).toEqual({
      ok: false,
      events: [],
      message: "Invalid response.",
    });
  });

  it("returns ok:false when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    const result = await fetchBoxOfficeClassEvents("token-1");
    expect(result).toEqual({
      ok: false,
      events: [],
      message: "Could not reach the server.",
    });
  });
});
