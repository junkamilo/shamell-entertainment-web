import { describe, expect, it } from "vitest";
import {
  canAdvanceFromPhase,
  emptyWizard,
  getPhaseValidationError,
  phaseFlow,
  validateLogisticsFields,
  validatePhase,
} from "./wizardValidation";
import { makeContactLine, makeWizardData } from "../../test/fixtures/contacto.fixture";
import {
  FIXTURE_CONTACT_LINE_ID,
  FIXTURE_OCCASION_ID,
  FIXTURE_SERVICE_ID,
} from "../../test/fixtures/uuids.fixture";

const defaultOpts = {
  catalogDismissed: false,
  catalogSnapshot: null,
  hadServiceTypeInUrl: false,
};

describe("wizardValidation", () => {
  describe("emptyWizard", () => {
    it("returns blank wizard with optional initial service type", () => {
      expect(emptyWizard()).toMatchObject({
        inquiryCode: "",
        contactLineId: "",
        fullName: "",
      });
      expect(emptyWizard("VIP_EVENT").inquiryCode).toBe("VIP_EVENT");
    });
  });

  describe("phaseFlow", () => {
    it("includes experiences for gala and vip", () => {
      expect(phaseFlow("PRIVATE_GALA")).toContain("experiences");
      expect(phaseFlow("VIP_EVENT")).toContain("experiences");
      expect(phaseFlow("GENERAL")).not.toContain("experiences");
    });
  });

  describe("validatePhase", () => {
    const lines = [makeContactLine()];

    it("requires a contact line on service phase", () => {
      expect(
        validatePhase("service", emptyWizard(), lines, defaultOpts),
      ).toMatch(/select one of the catalog offerings/i);
    });

    it("passes service phase when line selected", () => {
      expect(
        validatePhase(
          "service",
          { ...emptyWizard(), contactLineId: FIXTURE_CONTACT_LINE_ID },
          lines,
          defaultOpts,
        ),
      ).toBeNull();
    });

    it("requires occasion on detail phase when singles exist", () => {
      expect(
        validatePhase(
          "detail",
          { ...emptyWizard(), contactLineId: FIXTURE_CONTACT_LINE_ID },
          lines,
          defaultOpts,
        ),
      ).toMatch(/type of occasion/i);
    });

    it("requires service options on serviceType phase", () => {
      expect(
        validatePhase(
          "serviceType",
          {
            ...emptyWizard("GENERAL"),
            contactLineId: FIXTURE_CONTACT_LINE_ID,
          },
          lines,
          defaultOpts,
        ),
      ).toMatch(/select at least one service option/i);
    });

    it("validates contact fields", () => {
      expect(
        validatePhase(
          "contact",
          emptyWizard({ fullName: "A", email: "bad" }),
          lines,
          defaultOpts,
        ),
      ).toMatch(/name must be at least 2/i);

      expect(
        validatePhase(
          "contact",
          makeWizardData({ email: "not-an-email" }),
          lines,
          defaultOpts,
        ),
      ).toMatch(/valid email/i);
    });

    it("validates expectations message length", () => {
      expect(
        validatePhase("expectations", makeWizardData({ message: "short" }), lines, defaultOpts),
      ).toMatch(/at least 10 characters/i);
    });
  });

  describe("validateLogisticsFields", () => {
    it("requires date and times for standard events", () => {
      expect(
        validateLogisticsFields(
          makeWizardData({ eventDate: "", eventTimeStart: "", eventTimeEnd: "" }),
          false,
        ),
      ).toMatch(/choose an event date/i);
    });

    it("allows bespoke deadline note without date", () => {
      expect(
        validateLogisticsFields(
          makeWizardData({
            inquiryCode: "BESPOKE",
            eventDate: "",
            eventTimeStart: "",
            eventTimeEnd: "",
            projectDeadlineNote: "Need delivery by March",
            location: "Miami",
            eventAddress: "123 Ocean Drive",
            guestCount: "50",
          }),
          true,
        ),
      ).toBeNull();
    });
  });

  describe("getPhaseValidationError / canAdvanceFromPhase", () => {
    it("delegates to validatePhase", () => {
      const data = {
        ...emptyWizard("GENERAL"),
        contactLineId: FIXTURE_CONTACT_LINE_ID,
        occasionTypeId: FIXTURE_OCCASION_ID,
        serviceOptionIds: [FIXTURE_SERVICE_ID],
      };

      expect(getPhaseValidationError("detail", data, [makeContactLine()], defaultOpts)).toBeNull();
      expect(canAdvanceFromPhase("detail", data, [makeContactLine()], defaultOpts)).toBe(true);
      expect(canAdvanceFromPhase("service", data, [makeContactLine()], defaultOpts)).toBe(true);

      const empty = emptyWizard("GENERAL");
      expect(canAdvanceFromPhase("service", empty, [makeContactLine()], defaultOpts)).toBe(false);
    });
  });
});
