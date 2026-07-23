import { describe, expect, it } from "vitest";
import {
  AGENDAR_PATH,
  AGENDA_HUB_PATH,
  AGENDA_PETICIONES_PATH,
} from "./agendaRoutes";

describe("agendaRoutes", () => {
  it("re-exports canonical /admin agenda paths", () => {
    expect(AGENDA_HUB_PATH).toBe("/admin/agenda");
    expect(AGENDAR_PATH).toBe("/admin/agenda/agendar");
    expect(AGENDA_PETICIONES_PATH).toBe("/admin/agenda/peticiones");
  });
});
