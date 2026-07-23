import { describe, expect, it } from "vitest";
import type { PrivateClassFormFields } from "../types/privateClass.types";
import {
  buildPrivateClassDetailsSnapshot,
  buildPrivateClassRequestBody,
  parsePrivateClassAmountUsd,
  validatePrivateClassForm,
} from "./privateClassValidation";

function validFields(
  overrides: Partial<PrivateClassFormFields> = {},
): PrivateClassFormFields {
  return {
    classType: "Private belly dance",
    eventDate: "2026-08-15",
    eventTimeStart: "10:00",
    location: "Studio A",
    customerName: "Ada Lovelace",
    customerEmail: "Ada@Example.com",
    customerPhone: "",
    notes: "",
    amountUsd: "120",
    paymentMethod: "stripe",
    cashConfirmed: false,
    ...overrides,
  };
}

describe("parsePrivateClassAmountUsd", () => {
  it("parses currency-like strings", () => {
    expect(parsePrivateClassAmountUsd("1,234.5")).toBe(1234.5);
    expect(parsePrivateClassAmountUsd(" 99.999 ")).toBe(100);
  });

  it("rejects amounts below $1", () => {
    expect(parsePrivateClassAmountUsd("0")).toBeNull();
    expect(parsePrivateClassAmountUsd("")).toBeNull();
    expect(parsePrivateClassAmountUsd("abc")).toBeNull();
  });
});

describe("validatePrivateClassForm", () => {
  it("accepts a valid stripe form", () => {
    expect(validatePrivateClassForm(validFields())).toBeNull();
  });

  it("requires core fields", () => {
    expect(validatePrivateClassForm(validFields({ classType: " " }))).toBe(
      "Enter the class type.",
    );
    expect(validatePrivateClassForm(validFields({ eventDate: "08-15-2026" }))).toBe(
      "Pick a date.",
    );
    expect(validatePrivateClassForm(validFields({ eventTimeStart: "10" }))).toBe(
      "Pick a start time.",
    );
    expect(validatePrivateClassForm(validFields({ location: "" }))).toBe(
      "Enter the location.",
    );
    expect(validatePrivateClassForm(validFields({ customerName: "" }))).toBe(
      "Enter the client name.",
    );
    expect(validatePrivateClassForm(validFields({ customerEmail: "bad" }))).toBe(
      "Enter a valid email.",
    );
    expect(validatePrivateClassForm(validFields({ amountUsd: "0.5" }))).toBe(
      "Enter a price of at least $1.",
    );
  });

  it("requires cash confirmation for cash payments", () => {
    expect(
      validatePrivateClassForm(
        validFields({ paymentMethod: "cash", cashConfirmed: false }),
      ),
    ).toBe("Confirm that cash payment was received.");
  });
});

describe("buildPrivateClassRequestBody", () => {
  it("trims fields and lowercases email", () => {
    const body = buildPrivateClassRequestBody(
      validFields({
        customerPhone: " 555-0100 ",
        notes: " Bring shoes ",
      }),
    );
    expect(body).toEqual(
      expect.objectContaining({
        customerEmail: "ada@example.com",
        customerPhone: "555-0100",
        notes: "Bring shoes",
        amountUsd: 120,
      }),
    );
  });

  it("omits empty phone and notes", () => {
    const body = buildPrivateClassRequestBody(validFields());
    expect(body).not.toHaveProperty("customerPhone");
    expect(body).not.toHaveProperty("notes");
  });

  it("returns null for invalid amount", () => {
    expect(buildPrivateClassRequestBody(validFields({ amountUsd: "0" }))).toBeNull();
  });
});

describe("buildPrivateClassDetailsSnapshot", () => {
  it("builds a private_class details object", () => {
    const snap = buildPrivateClassDetailsSnapshot(validFields(), "cash");
    expect(snap).toEqual(
      expect.objectContaining({
        kind: "private_class",
        paymentMethod: "cash",
        currency: "usd",
        source: "admin_book_class_private",
        amountUsd: 120,
      }),
    );
    expect(snap?.submittedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns null when amount is invalid", () => {
    expect(
      buildPrivateClassDetailsSnapshot(validFields({ amountUsd: "nope" }), "stripe"),
    ).toBeNull();
  });
});
