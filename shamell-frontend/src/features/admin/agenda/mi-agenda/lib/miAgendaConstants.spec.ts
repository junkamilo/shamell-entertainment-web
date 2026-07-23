import { describe, expect, it } from "vitest";
import { WEEKDAY_SHORT } from "./miAgendaConstants";

describe("miAgendaConstants", () => {
  it("lists seven weekday labels starting Monday", () => {
    expect(WEEKDAY_SHORT).toHaveLength(7);
    expect(WEEKDAY_SHORT[0]).toMatch(/^Mon/i);
  });
});
