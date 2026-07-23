import { describe, expect, it } from "vitest";
import { isBookingIdUuid, isQueryUuid } from "./agendarQuery";
import { FIXTURE_BOOKING_ID } from "../tests/fixtures/uuids.fixture";

describe("agendarQuery", () => {
  it("accepts valid UUID v4 values", () => {
    expect(isQueryUuid(FIXTURE_BOOKING_ID)).toBe(true);
    expect(isBookingIdUuid(FIXTURE_BOOKING_ID)).toBe(true);
  });

  it("rejects invalid UUIDs", () => {
    expect(isQueryUuid("")).toBe(false);
    expect(isQueryUuid("not-a-uuid")).toBe(false);
    expect(isQueryUuid("00000000-0000-0000-0000-000000000000")).toBe(false);
    expect(isQueryUuid("550e8400-e29b-41d4-a716-44665544000g")).toBe(false);
  });

  it("trims whitespace before validating", () => {
    expect(isQueryUuid(`  ${FIXTURE_BOOKING_ID}  `)).toBe(true);
  });
});
