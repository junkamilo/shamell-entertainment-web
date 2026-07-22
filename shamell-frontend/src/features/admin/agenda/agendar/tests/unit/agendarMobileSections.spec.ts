import { describe, expect, it } from "vitest";
import { AGENDAR_MOBILE_SECTIONS } from "../../lib/agendarMobileSections";

describe("AGENDAR_MOBILE_SECTIONS", () => {
  it("defines event, logistics, and client in order", () => {
    expect(AGENDAR_MOBILE_SECTIONS.map((s) => s.id)).toEqual(["event", "logistics", "client"]);
  });

  it("includes human-readable titles", () => {
    expect(AGENDAR_MOBILE_SECTIONS[0].title).toBe("EVENT SETUP");
    expect(AGENDAR_MOBILE_SECTIONS[1].title).toBe("WHEN & WHERE");
    expect(AGENDAR_MOBILE_SECTIONS[2].title).toBe("CLIENT & NOTES");
  });
});
