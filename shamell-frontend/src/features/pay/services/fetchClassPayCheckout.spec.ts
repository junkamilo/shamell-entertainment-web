import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { fetchClassPayCheckoutClientSecret } from "./fetchClassPayCheckout";

const TOKEN = "pay_tok_class";

describe("fetchClassPayCheckoutClientSecret", () => {
  it("returns client secret on success", async () => {
    server.use(
      http.get("*/api/v1/class-enrollments/public/pay/checkout", () =>
        HttpResponse.json({ clientSecret: "cs_test_class" }),
      ),
    );
    await expect(fetchClassPayCheckoutClientSecret(TOKEN)).resolves.toEqual({
      ok: true,
      clientSecret: "cs_test_class",
    });
  });

  it("returns server message on non-ok response", async () => {
    server.use(
      http.get("*/api/v1/class-enrollments/public/pay/checkout", () =>
        HttpResponse.json({ message: "Unavailable" }, { status: 400 }),
      ),
    );
    await expect(fetchClassPayCheckoutClientSecret(TOKEN)).resolves.toEqual({
      ok: false,
      message: "Unavailable",
    });
  });
});
