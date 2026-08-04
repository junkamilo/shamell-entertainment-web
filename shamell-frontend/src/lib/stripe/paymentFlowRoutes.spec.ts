import { describe, expect, it } from "vitest";
import {
  PAY_CLASS_PATH,
  PAY_QUOTE_PATH,
  PAY_QUOTE_RETURN_PATH,
  PAY_ROOT_PATH,
} from "@/lib/pay/payRoutes";
import { isPaymentFlowRoute } from "./paymentFlowRoutes";

describe("isPaymentFlowRoute", () => {
  it("matches pay root and nested pay paths", () => {
    expect(isPaymentFlowRoute(PAY_ROOT_PATH)).toBe(true);
    expect(isPaymentFlowRoute(PAY_QUOTE_PATH)).toBe(true);
    expect(isPaymentFlowRoute(`${PAY_QUOTE_PATH}?token=x`)).toBe(true);
    expect(isPaymentFlowRoute(PAY_CLASS_PATH)).toBe(true);
    expect(isPaymentFlowRoute(PAY_QUOTE_RETURN_PATH)).toBe(true);
  });

  it("matches on-coming-events Stripe return paths", () => {
    expect(isPaymentFlowRoute("/on-coming-events/return")).toBe(true);
    expect(isPaymentFlowRoute("/on-coming-events/gala/return")).toBe(true);
    expect(isPaymentFlowRoute("/on-coming-events/gala/classes/return")).toBe(true);
    expect(isPaymentFlowRoute("/on-coming-events/gala/classes/package-return")).toBe(
      true,
    );
    expect(isPaymentFlowRoute("/on-coming-events/gala/seats/return")).toBe(true);
  });

  it("rejects unrelated public routes", () => {
    expect(isPaymentFlowRoute("/")).toBe(false);
    expect(isPaymentFlowRoute("/gallery")).toBe(false);
    expect(isPaymentFlowRoute("/on-coming-events")).toBe(false);
    expect(isPaymentFlowRoute("/on-coming-events/gala")).toBe(false);
    expect(isPaymentFlowRoute("/admin/login")).toBe(false);
  });
});
