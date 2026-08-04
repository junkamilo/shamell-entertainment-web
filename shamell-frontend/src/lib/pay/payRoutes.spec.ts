import { describe, expect, it } from "vitest";
import {
  PAY_CLASS_PATH,
  PAY_CLASS_RETURN_PATH,
  PAY_QUOTE_PATH,
  PAY_QUOTE_RETURN_PATH,
  PAY_ROOT_PATH,
  PAY_VENUE_SEAT_PATH,
  PAY_VENUE_SEAT_RETURN_PATH,
  buildPayClassHref,
  buildPayQuoteHref,
  buildPayVenueSeatHref,
} from "./payRoutes";

describe("payRoutes", () => {
  it("exports canonical pay paths", () => {
    expect(PAY_ROOT_PATH).toBe("/pay");
    expect(PAY_QUOTE_PATH).toBe("/pay/quote");
    expect(PAY_CLASS_PATH).toBe("/pay/class");
    expect(PAY_VENUE_SEAT_PATH).toBe("/pay/venue-seat");
    expect(PAY_QUOTE_RETURN_PATH).toBe("/pay/quote/return");
    expect(PAY_CLASS_RETURN_PATH).toBe("/pay/class/return");
    expect(PAY_VENUE_SEAT_RETURN_PATH).toBe("/pay/venue-seat/return");
  });

  it("builds token checkout hrefs", () => {
    expect(buildPayQuoteHref("abc")).toBe("/pay/quote?token=abc");
    expect(buildPayClassHref("abc")).toBe("/pay/class?token=abc");
    expect(buildPayVenueSeatHref("tok+1")).toBe(
      `/pay/venue-seat?token=${encodeURIComponent("tok+1")}`,
    );
  });
});
