import { describe, expect, it } from "vitest";
import {
  isPrivateClassBookingDetails,
  privateClassTypeFromDetails,
} from "./privateClassBookingDetails";

describe("isPrivateClassBookingDetails", () => {
  it("detects private_class kind", () => {
    expect(isPrivateClassBookingDetails({ kind: "private_class" })).toBe(true);
  });

  it("rejects non-objects and other kinds", () => {
    expect(isPrivateClassBookingDetails(null)).toBe(false);
    expect(isPrivateClassBookingDetails([])).toBe(false);
    expect(isPrivateClassBookingDetails({ kind: "booking" })).toBe(false);
  });
});

describe("privateClassTypeFromDetails", () => {
  it("returns a trimmed class type", () => {
    expect(
      privateClassTypeFromDetails({ kind: "private_class", classType: "  Ballet  " }),
    ).toBe("Ballet");
  });

  it("returns null when missing or blank", () => {
    expect(privateClassTypeFromDetails({ kind: "private_class" })).toBeNull();
    expect(
      privateClassTypeFromDetails({ kind: "private_class", classType: "   " }),
    ).toBeNull();
    expect(privateClassTypeFromDetails({ kind: "other", classType: "X" })).toBeNull();
  });
});
