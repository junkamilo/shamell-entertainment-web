import { describe, expect, it } from "vitest";
import { AGENDAR_FORM_ID, fieldLabelClass } from "./agendaFormStyles";

describe("agendaFormStyles", () => {
  it("exports the form id and field class tokens", () => {
    expect(AGENDAR_FORM_ID).toBe("shamell-agendar-booking-form");
    expect(fieldLabelClass).toContain("text-gold");
  });
});
