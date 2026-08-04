import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  fetchQuoteCheckoutClientSecret,
  fetchQuotePaymentSessionStatus,
} from "./fetchQuoteCheckout";

const TOKEN = "pay_tok_quote";

describe("fetchQuoteCheckoutClientSecret", () => {
  it("returns client secret on success", async () => {
    server.use(
      http.get("*/api/v1/bookings/public/quote/checkout", () =>
        HttpResponse.json({ clientSecret: "cs_test_quote" }),
      ),
    );
    await expect(fetchQuoteCheckoutClientSecret(TOKEN)).resolves.toEqual({
      ok: true,
      clientSecret: "cs_test_quote",
    });
  });

  it("returns server message on non-ok response", async () => {
    server.use(
      http.get("*/api/v1/bookings/public/quote/checkout", () =>
        HttpResponse.json({ message: "Link expired" }, { status: 410 }),
      ),
    );
    await expect(fetchQuoteCheckoutClientSecret(TOKEN)).resolves.toEqual({
      ok: false,
      message: "Link expired",
    });
  });

  it("returns invalid response when clientSecret is missing", async () => {
    server.use(
      http.get("*/api/v1/bookings/public/quote/checkout", () =>
        HttpResponse.json({}),
      ),
    );
    await expect(fetchQuoteCheckoutClientSecret(TOKEN)).resolves.toEqual({
      ok: false,
      message: "Invalid checkout response.",
    });
  });
});

describe("fetchQuotePaymentSessionStatus", () => {
  it("returns session payload when ok", async () => {
    server.use(
      http.get("*/api/v1/bookings/public/quote/session-status", () =>
        HttpResponse.json({
          stripeStatus: "complete",
          paymentStatus: "PAID",
          stage: "PAID",
          amount: 150,
          currency: "usd",
          customerName: "Ada",
          customerEmail: "ada@example.com",
        }),
      ),
    );
    await expect(fetchQuotePaymentSessionStatus("cs_1")).resolves.toEqual(
      expect.objectContaining({
        stripeStatus: "complete",
        paymentStatus: "PAID",
        amount: 150,
      }),
    );
  });

  it("returns null when not ok", async () => {
    server.use(
      http.get("*/api/v1/bookings/public/quote/session-status", () =>
        HttpResponse.json({ message: "nope" }, { status: 404 }),
      ),
    );
    await expect(fetchQuotePaymentSessionStatus("cs_1")).resolves.toBeNull();
  });
});
