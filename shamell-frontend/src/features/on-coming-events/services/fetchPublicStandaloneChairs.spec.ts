import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchPublicStandaloneChairs } from "./fetchPublicStandaloneChairs";

describe("fetchPublicStandaloneChairs", () => {
  it("loads mapped standalone chair config", async () => {
    const config = await fetchPublicStandaloneChairs();
    expect(config.availableQuantity).toBe(5);
    expect(config.unitPrice).toBe(35);
  });

  it("returns default config on non-ok response", async () => {
    server.use(
      http.get("*/api/v1/standalone-chairs", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    const config = await fetchPublicStandaloneChairs();
    expect(config.availableQuantity).toBe(0);
    expect(config.unitPrice).toBe(0);
  });
});
