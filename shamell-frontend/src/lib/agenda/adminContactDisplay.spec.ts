import { describe, expect, it } from "vitest";
import { formatContactSubjectForAdmin } from "./adminContactDisplay";

describe("formatContactSubjectForAdmin", () => {
  it("returns the default label for empty subjects", () => {
    expect(formatContactSubjectForAdmin(null)).toBe("Consulta de reserva");
    expect(formatContactSubjectForAdmin("   ")).toBe("Consulta de reserva");
  });

  it("strips known service-type code suffixes", () => {
    expect(formatContactSubjectForAdmin("Wedding inquiry — PRIVATE_GALA")).toBe(
      "Wedding inquiry",
    );
    expect(formatContactSubjectForAdmin("Show — VIP_EVENT")).toBe("Show");
  });

  it("keeps unknown suffixes and neutralizes Reservation inquiry", () => {
    expect(formatContactSubjectForAdmin("Custom — UNKNOWN_CODE")).toBe(
      "Custom — UNKNOWN_CODE",
    );
    expect(formatContactSubjectForAdmin("Reservation inquiry")).toBe(
      "Consulta de reserva",
    );
  });
});
