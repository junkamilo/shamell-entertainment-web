import { describe, expect, it } from "vitest";
import { AGENDA_HUB_ICON } from "./agendaHubIcons";

describe("AGENDA_HUB_ICON", () => {
  it("exposes icon paths for each hub card", () => {
    expect(AGENDA_HUB_ICON.book).toBeTruthy();
    expect(AGENDA_HUB_ICON.inbox).toBeTruthy();
    expect(AGENDA_HUB_ICON.myCalendar).toBeTruthy();
  });
});
