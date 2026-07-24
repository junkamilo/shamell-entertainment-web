import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { makeOccupiedRangesPayload } from "../test/fixtures/contacto.fixture";
import { fetchOccupiedRanges } from "./fetchOccupiedRanges";

describe("fetchOccupiedRanges", () => {
  it("loads occupied ranges for a date", async () => {
    const ranges = await fetchOccupiedRanges("2030-08-01");
    expect(ranges).toEqual([{ startMinutes: 600, endMinutes: 720 }]);
  });

  it("encodes the date query param", async () => {
    let url = "";
    server.use(
      http.get("*/api/v1/bookings/public/occupied", ({ request }) => {
        url = request.url;
        return HttpResponse.json(makeOccupiedRangesPayload());
      }),
    );

    await fetchOccupiedRanges("2030-12-25");
    expect(url).toContain("date=2030-12-25");
  });

  it("throws on non-ok response", async () => {
    server.use(
      http.get("*/api/v1/bookings/public/occupied", () =>
        HttpResponse.json({ message: "nope" }, { status: 500 }),
      ),
    );

    await expect(fetchOccupiedRanges("2030-08-01")).rejects.toThrow("occupied");
  });

  it("returns empty array when occupied is missing or invalid", async () => {
    server.use(
      http.get("*/api/v1/bookings/public/occupied", () => HttpResponse.json({})),
    );
    await expect(fetchOccupiedRanges("2030-08-01")).resolves.toEqual([]);

    server.use(
      http.get("*/api/v1/bookings/public/occupied", () =>
        HttpResponse.json({ occupied: [{ startMinutes: "bad", endMinutes: 720 }] }),
      ),
    );
    await expect(fetchOccupiedRanges("2030-08-01")).resolves.toEqual([]);
  });
});
