import { describe, expect, it } from "vitest";
import { makeConciergeFormData } from "../test/fixtures/contacto.fixture";
import { validateConciergeForm } from "./conciergeFormValidation";

const valid = makeConciergeFormData();

describe("validateConciergeForm", () => {
  it("accepts a complete required payload", () => {
    expect(validateConciergeForm(valid)).toBeNull();
  });

  it("requires name, email, phone, location, date, guests, planning, and message", () => {
    expect(validateConciergeForm(makeConciergeFormData({ fullName: "A" }))).toMatch(
      /full name/i,
    );
    expect(validateConciergeForm(makeConciergeFormData({ email: "nope" }))).toMatch(
      /valid email/i,
    );
    expect(validateConciergeForm(makeConciergeFormData({ phone: "" }))).toMatch(
      /phone number/i,
    );
    expect(validateConciergeForm(makeConciergeFormData({ phone: "12" }))).toMatch(
      /7\+ digits/i,
    );
    expect(validateConciergeForm(makeConciergeFormData({ location: "M" }))).toMatch(
      /city or event location/i,
    );
    expect(validateConciergeForm(makeConciergeFormData({ eventDate: "" }))).toMatch(
      /tentative date/i,
    );
    expect(validateConciergeForm(makeConciergeFormData({ guestCount: "" }))).toMatch(
      /guest count/i,
    );
    expect(validateConciergeForm(makeConciergeFormData({ guestCount: "0" }))).toMatch(
      /whole number/i,
    );
    expect(validateConciergeForm(makeConciergeFormData({ planningStage: "" }))).toMatch(
      /planning/i,
    );
    expect(
      validateConciergeForm(makeConciergeFormData({ message: "Too short" })),
    ).toMatch(/little more/i);
  });

  it("allows occasion hint to stay empty", () => {
    expect(validateConciergeForm(makeConciergeFormData({ occasionHint: "" }))).toBeNull();
  });
});
