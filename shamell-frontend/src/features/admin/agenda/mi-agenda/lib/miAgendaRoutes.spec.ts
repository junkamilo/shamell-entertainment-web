import { describe, expect, it } from "vitest";
import { AGENDA_HUB_PATH, AGENDA_MI_AGENDA_PATH } from "./miAgendaRoutes";

describe("miAgendaRoutes", () => {
  it("re-exports hub and calendar paths", () => {
    expect(AGENDA_HUB_PATH).toBe("/admin/agenda");
    expect(AGENDA_MI_AGENDA_PATH).toBe("/admin/agenda/mi-agenda");
  });
});
