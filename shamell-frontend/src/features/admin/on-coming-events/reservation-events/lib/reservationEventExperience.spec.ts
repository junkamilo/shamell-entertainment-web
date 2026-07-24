import { describe, expect, it } from "vitest";
import {
  experienceFromScheduleMode,
  experienceFromTemplate,
  findTemplateById,
} from "./reservationEventExperience";
import {
  makeRecurringReservationEventTemplate,
  makeReservationEventTemplate,
} from "../../test/fixtures/onComingEvents.fixture";
import { FIXTURE_TEMPLATE_ID, FIXTURE_TEMPLATE_ID_2 } from "../../test/fixtures/uuids.fixture";

describe("reservationEventExperience", () => {
  describe("experienceFromScheduleMode", () => {
    it("maps FIXED_EVENT to VENUE_SEATING", () => {
      expect(experienceFromScheduleMode("FIXED_EVENT")).toEqual({
        experienceType: "VENUE_SEATING",
        classVariant: undefined,
      });
    });

    it("maps RECURRING_WEEKLY to CLASSES GROUP", () => {
      expect(experienceFromScheduleMode("RECURRING_WEEKLY")).toEqual({
        experienceType: "CLASSES",
        classVariant: "GROUP",
      });
    });
  });

  describe("experienceFromTemplate", () => {
    it("returns null for undefined template", () => {
      expect(experienceFromTemplate(undefined)).toBeNull();
    });

    it("derives experience from template schedule mode", () => {
      expect(experienceFromTemplate(makeReservationEventTemplate())).toEqual({
        experienceType: "VENUE_SEATING",
        classVariant: undefined,
      });
      expect(experienceFromTemplate(makeRecurringReservationEventTemplate())).toEqual({
        experienceType: "CLASSES",
        classVariant: "GROUP",
      });
    });
  });

  describe("findTemplateById", () => {
    it("finds a template by id", () => {
      const templates = [
        makeReservationEventTemplate(),
        makeRecurringReservationEventTemplate(),
      ];
      expect(findTemplateById(templates, FIXTURE_TEMPLATE_ID)?.name).toBe("Saturday Gala");
      expect(findTemplateById(templates, FIXTURE_TEMPLATE_ID_2)?.name).toBe("Weekly Bachata");
    });

    it("returns undefined when not found", () => {
      expect(findTemplateById([], FIXTURE_TEMPLATE_ID)).toBeUndefined();
    });
  });
});
