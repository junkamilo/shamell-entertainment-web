import { describe, expect, it } from "vitest";
import { AGENDA_HUB_CARDS } from "./agendaHubCards";
import { AGENDA_PETICIONES_PATH } from "./agendaRoutes";

describe("AGENDA_HUB_CARDS", () => {
  it("lists the hub cards with unique hrefs", () => {
    expect(AGENDA_HUB_CARDS.length).toBeGreaterThanOrEqual(6);
    const hrefs = AGENDA_HUB_CARDS.map((c) => c.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("marks inbox as the fire/badge card", () => {
    const inbox = AGENDA_HUB_CARDS.find((c) => c.href === AGENDA_PETICIONES_PATH);
    expect(inbox?.fire).toBe(true);
    expect(inbox?.badgeKey).toBe("peticionesBadge");
  });
});
