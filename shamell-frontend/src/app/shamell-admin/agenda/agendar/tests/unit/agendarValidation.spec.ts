import { describe, expect, it } from "vitest";
import {
  getAgendarMobileSectionStatus,
  sanitizeIntegerInput,
  sanitizeNameInput,
  sanitizePhoneInput,
  validateAgendarForm,
} from "../../lib/agendarValidation";
import { emptyAgendarFormValues, validAgendarFormValues } from "../fixtures/formValues.fixture";

describe("agendarValidation sanitizers", () => {
  it("sanitizeNameInput strips digits", () => {
    expect(sanitizeNameInput("Jane2 Doe")).toBe("Jane Doe");
  });

  it("sanitizePhoneInput keeps phone characters only", () => {
    expect(sanitizePhoneInput("abc+1 (555) 12-34")).toBe("+1 (555) 12-34");
  });

  it("sanitizeIntegerInput keeps digits only", () => {
    expect(sanitizeIntegerInput("12a3")).toBe("123");
  });
});

describe("getAgendarMobileSectionStatus", () => {
  it("marks all sections incomplete for empty form", () => {
    expect(getAgendarMobileSectionStatus(emptyAgendarFormValues)).toEqual({
      event: false,
      logistics: false,
      client: false,
    });
  });

  it("marks all sections complete for valid form", () => {
    expect(getAgendarMobileSectionStatus(validAgendarFormValues)).toEqual({
      event: true,
      logistics: true,
      client: true,
    });
  });

  it("marks logistics incomplete when location is too short", () => {
    const values = { ...validAgendarFormValues, location: "AB" };
    expect(getAgendarMobileSectionStatus(values).logistics).toBe(false);
  });
});

describe("validateAgendarForm", () => {
  it("returns normalized data for a valid form", () => {
    const result = validateAgendarForm(validAgendarFormValues);
    expect(result.error).toBeNull();
    expect(result.normalized?.guestCount).toBe(120);
    expect(result.normalized?.serviceIds).toHaveLength(2);
    expect(result.normalized?.guestEmail).toBe("jane@example.com");
  });

  it("requires at least one service", () => {
    const result = validateAgendarForm({ ...validAgendarFormValues, serviceIds: [] });
    expect(result.error).toBe("Select at least one service.");
  });

  it("rejects invalid email", () => {
    const result = validateAgendarForm({ ...validAgendarFormValues, guestEmail: "bad-email" });
    expect(result.error).toBe("Invalid email. Example: name@example.com");
  });

  it("rejects phone with too few digits", () => {
    const result = validateAgendarForm({ ...validAgendarFormValues, guestPhone: "123" });
    expect(result.error).toBe("Invalid phone. It must have between 7 and 15 digits.");
  });

  it("rejects guest count out of range", () => {
    const result = validateAgendarForm({ ...validAgendarFormValues, guestCount: "0" });
    expect(result.error).toBe("Guest count must be a whole number between 1 and 20,000.");
  });

  it("rejects notes longer than 1000 characters", () => {
    const result = validateAgendarForm({
      ...validAgendarFormValues,
      notes: "x".repeat(1001),
    });
    expect(result.error).toBe("Internal notes cannot exceed 1,000 characters.");
  });

  it("rejects names containing digits", () => {
    const result = validateAgendarForm({ ...validAgendarFormValues, guestFullName: "Jane2" });
    expect(result.error).toBe("Client name must not include numbers.");
  });
});
