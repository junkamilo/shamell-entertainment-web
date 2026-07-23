import { describe, expect, it } from "vitest";
import { formatAgendaHubNotificationSubtitle } from "./agendaHubHero";

describe("formatAgendaHubNotificationSubtitle", () => {
  it("returns null when there are no updates", () => {
    expect(formatAgendaHubNotificationSubtitle(0)).toBeNull();
    expect(formatAgendaHubNotificationSubtitle(-1)).toBeNull();
  });

  it("uses singular wording for one update", () => {
    expect(formatAgendaHubNotificationSubtitle(1)).toBe(
      "1 payment or inbox update since your last visit",
    );
  });

  it("uses plural wording for multiple updates", () => {
    expect(formatAgendaHubNotificationSubtitle(3)).toBe(
      "3 payment or inbox updates since your last visit",
    );
  });
});
