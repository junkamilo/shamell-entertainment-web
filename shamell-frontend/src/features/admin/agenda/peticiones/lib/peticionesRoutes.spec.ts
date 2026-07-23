import { describe, expect, it } from "vitest";
import {
  AGENDAR_PATH,
  AGENDA_HUB_PATH,
  AGENDA_PETICIONES_PATH,
} from "./peticionesRoutes";

describe("peticionesRoutes", () => {
  it("re-exports agenda route constants", () => {
    expect(AGENDAR_PATH).toBe("/admin/agenda/agendar");
    expect(AGENDA_HUB_PATH).toBe("/admin/agenda");
    expect(AGENDA_PETICIONES_PATH).toBe("/admin/agenda/peticiones");
  });
});
