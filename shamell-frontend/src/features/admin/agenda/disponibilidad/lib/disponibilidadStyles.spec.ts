import { describe, it, expect } from "vitest";
import * as disponibilidadStyles from "./disponibilidadStyles";

describe("disponibilidadStyles", () => {
  const entries = Object.entries(disponibilidadStyles);

  it("exports at least one style constant", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)("%s is a non-empty string", (_name, value) => {
    expect(typeof value).toBe("string");
    expect((value as string).trim().length).toBeGreaterThan(0);
  });

  it("exports the expected named style constants", () => {
    expect(Object.keys(disponibilidadStyles)).toEqual(
      expect.arrayContaining([
        "disponibilidadSectionTitleClass",
        "disponibilidadDayLabelClass",
        "disponibilidadBodyTextClass",
        "disponibilidadTimeTriggerClass",
        "disponibilidadFieldLabelClass",
        "disponibilidadActionButtonClass",
        "disponibilidadSecondaryButtonClass",
        "disponibilidadTabButtonActiveClass",
        "disponibilidadTabButtonInactiveClass",
      ]),
    );
  });
});
