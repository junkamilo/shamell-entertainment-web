import { describe, expect, it } from "vitest";
import {
  combineDateAndTime,
  splitIsoToDateAndTime,
} from "./reservationDateTimeFields";

describe("splitIsoToDateAndTime", () => {
  it("returns empty strings for nullish or invalid input", () => {
    expect(splitIsoToDateAndTime(null)).toEqual({ date: "", time: "" });
    expect(splitIsoToDateAndTime(undefined)).toEqual({ date: "", time: "" });
    expect(splitIsoToDateAndTime("not-a-date")).toEqual({ date: "", time: "" });
  });

  it("splits a valid ISO timestamp into local date and time parts", () => {
    const iso = combineDateAndTime("2030-08-01", "20:30");
    expect(splitIsoToDateAndTime(iso)).toEqual({
      date: "2030-08-01",
      time: "20:30",
    });
  });
});

describe("combineDateAndTime", () => {
  it("returns undefined when date is blank", () => {
    expect(combineDateAndTime("", "12:00")).toBeUndefined();
    expect(combineDateAndTime("   ", "12:00")).toBeUndefined();
  });

  it("combines date and time into an ISO string", () => {
    const iso = combineDateAndTime("2030-08-01", "20:30");
    expect(iso).toBe(new Date("2030-08-01T20:30").toISOString());
  });

  it("defaults missing time to midnight", () => {
    const iso = combineDateAndTime("2030-08-01", "");
    expect(iso).toBe(new Date("2030-08-01T00:00").toISOString());
  });

  it("returns undefined for invalid date/time combinations", () => {
    expect(combineDateAndTime("2030-13-40", "25:99")).toBeUndefined();
  });
});
