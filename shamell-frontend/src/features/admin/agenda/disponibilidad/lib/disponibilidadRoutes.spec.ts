import { describe, it, expect } from "vitest";
import { AGENDA_HUB_PATH, AGENDA_DISPONIBILIDAD_PATH } from "./disponibilidadRoutes";

describe("disponibilidadRoutes", () => {
  it("re-exports the canonical agenda hub path", () => {
    expect(AGENDA_HUB_PATH).toBe("/admin/agenda");
  });

  it("re-exports the canonical agenda disponibilidad path", () => {
    expect(AGENDA_DISPONIBILIDAD_PATH).toBe("/admin/agenda/disponibilidad");
  });
});
