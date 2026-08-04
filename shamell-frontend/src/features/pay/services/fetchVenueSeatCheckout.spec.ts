import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchVenueSeatCheckoutClientSecret } from "./fetchVenueSeatCheckout";

const TOKEN = "pay_tok_venue";

describe("fetchVenueSeatCheckoutClientSecret", () => {
  it("returns client secret on success", async () => {
    server.use(
      http.get("*/api/v1/venue-reservations/public/pay/checkout", () =>
        HttpResponse.json({ clientSecret: "cs_test_venue" }),
      ),
    );
    await expect(fetchVenueSeatCheckoutClientSecret(TOKEN)).resolves.toEqual({
      ok: true,
      clientSecret: "cs_test_venue",
    });
  });

  it("returns default message when body has no message", async () => {
    server.use(
      http.get("*/api/v1/venue-reservations/public/pay/checkout", () =>
        HttpResponse.json({}, { status: 404 }),
      ),
    );
    await expect(fetchVenueSeatCheckoutClientSecret(TOKEN)).resolves.toEqual({
      ok: false,
      message: "This payment link is no longer available.",
    });
  });
});
