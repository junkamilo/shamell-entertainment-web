import { describe, expect, it } from "vitest";
import {
  canAdvanceFromPhase,
  emptyWizard,
  getPhaseValidationError,
  phaseFlow,
  validateLogisticsFields,
  validatePhase,
} from "./wizardValidation";
import { makeCatalogSnapshot, makeContactLine, makeWizardData } from "../../test/fixtures/contacto.fixture";
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
          makeWizardData({ fullName: "A", email: "bad" }),
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

      expect(
        validatePhase("contact", makeWizardData({ email: "" }), lines, defaultOpts),
      ).toMatch(/email is required/i);
      expect(
        validatePhase("contact", makeWizardData({ phone: "12" }), lines, defaultOpts),
      ).toMatch(/valid phone/i);
      expect(
        validatePhase(
          "contact",
          makeWizardData({ phone: `+1${"2".repeat(40)}` }),
          lines,
          defaultOpts,
        ),
      ).toMatch(/valid phone/i);
      expect(
        validatePhase(
          "contact",
          makeWizardData({ phone: `+1 ${"2".repeat(7)}${"x".repeat(40)}` }),
          lines,
          defaultOpts,
        ),
      ).toMatch(/valid phone/i);
      expect(validatePhase("contact", makeWizardData({ phone: "" }), lines, defaultOpts)).toBeNull();
      expect(validatePhase("contact", makeWizardData(), lines, defaultOpts)).toBeNull();
    });

    it("validates expectations message length", () => {
      expect(
        validatePhase("expectations", makeWizardData({ message: "short" }), lines, defaultOpts),
      ).toMatch(/at least 10 characters/i);
      expect(validatePhase("expectations", makeWizardData(), lines, defaultOpts)).toBeNull();
      expect(
        validatePhase(
          "expectations",
          makeWizardData({ message: "x".repeat(4001) }),
          lines,
          defaultOpts,
        ),
      ).toMatch(/at most 4000/i);
    });

    it("treats experiences, review, and unknown phases as valid", () => {
      expect(validatePhase("experiences", makeWizardData(), lines, defaultOpts)).toBeNull();
      expect(validatePhase("review", makeWizardData(), lines, defaultOpts)).toBeNull();
      expect(validatePhase("nope" as never, makeWizardData(), lines, defaultOpts)).toBeNull();
    });

    it("allows a service-catalog inquiry without contact lines", () => {
      expect(
        validatePhase("service", emptyWizard("VIP_EVENT"), [], {
          ...defaultOpts,
          catalogSnapshot: makeCatalogSnapshot({ kind: "service" }),
        }),
      ).toBeNull();
      expect(validatePhase("service", emptyWizard(), [], defaultOpts)).toMatch(
        /not available/i,
      );
    });

    it("requires project and role occasions on detail", () => {
      const line = makeContactLine({
        occasionSingle: [],
        occasionBespokeProject: [{ id: FIXTURE_OCCASION_ID, name: "Film" }],
        occasionBespokeRole: [{ id: FIXTURE_OCCASION_ID, name: "Director" }],
      });
      expect(
        validatePhase(
          "detail",
          { ...emptyWizard(), contactLineId: FIXTURE_CONTACT_LINE_ID },
          [line],
          defaultOpts,
        ),
      ).toMatch(/project type/i);
      expect(
        validatePhase(
          "detail",
          {
            ...emptyWizard(),
            contactLineId: FIXTURE_CONTACT_LINE_ID,
            occasionTypeIdsProject: [FIXTURE_OCCASION_ID],
          },
          [line],
          defaultOpts,
        ),
      ).toMatch(/collaboration role/i);
    });

    it("accepts a valid service-catalog type and rejects an invalid code", () => {
      const serviceOpts = {
        ...defaultOpts,
        catalogSnapshot: makeCatalogSnapshot({ kind: "service" }),
      };
      expect(
        validatePhase("serviceType", emptyWizard("VIP_EVENT"), lines, serviceOpts),
      ).toBeNull();
      expect(
        validatePhase(
          "serviceType",
          { ...emptyWizard("GENERAL"), serviceOptionIds: [FIXTURE_SERVICE_ID] },
          lines,
          defaultOpts,
        ),
      ).toBeNull();
      expect(
        validatePhase(
          "serviceType",
          { ...emptyWizard(), inquiryCode: "NOPE", serviceOptionIds: [FIXTURE_SERVICE_ID] },
          lines,
          defaultOpts,
        ),
      ).toMatch(/valid service type/i);
    });

    it("uses bespoke date rules from collaboration roles", () => {
      const line = makeContactLine({
        occasionBespokeRole: [{ id: FIXTURE_OCCASION_ID, name: "Director" }],
      });
      expect(
        validatePhase(
          "logistics",
          makeWizardData({
            inquiryCode: "GENERAL",
            eventDate: "",
            projectDeadlineNote: "",
          }),
          [line],
          defaultOpts,
        ),
      ).toMatch(/event date or a project deadline/i);
    });

    it("passes detail when the contact line is missing or has no occasion lists", () => {
      expect(
        validatePhase("detail", { ...emptyWizard(), contactLineId: "missing" }, [makeContactLine()], defaultOpts),
      ).toBeNull();
      expect(
        validatePhase(
          "detail",
          { ...emptyWizard(), contactLineId: FIXTURE_CONTACT_LINE_ID },
          [makeContactLine({ occasionSingle: [], occasionBespokeProject: [], occasionBespokeRole: [] })],
          defaultOpts,
        ),
      ).toBeNull();
    });

    it("validates logistics through the phase using bespoke line rules", () => {
      const line = makeContactLine({
        occasionBespokeProject: [{ id: FIXTURE_OCCASION_ID, name: "Film" }],
      });
      expect(
        validatePhase(
          "logistics",
          makeWizardData({
            inquiryCode: "GENERAL",
            eventDate: "",
            projectDeadlineNote: "",
          }),
          [line],
          defaultOpts,
        ),
      ).toMatch(/event date or a project deadline/i);
      expect(
        validatePhase(
          "logistics",
          makeWizardData({
            inquiryCode: "BESPOKE",
            eventDate: "",
            projectDeadlineNote: "Need a window in March",
            location: "Miami",
            eventAddress: "123 Ocean Drive",
            guestCount: "10",
          }),
          [makeContactLine()],
          defaultOpts,
        ),
      ).toBeNull();
      expect(
        validatePhase(
          "logistics",
          makeWizardData({
            inquiryCode: "GENERAL",
            contactLineId: "",
            eventDate: "",
            projectDeadlineNote: "",
          }),
          [makeContactLine()],
          defaultOpts,
        ),
      ).toMatch(/choose an event date/i);
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

    it("validates venue, guests, times, and date edges", () => {
      const base = makeWizardData({
        eventAddress: "123 Ocean Drive",
        location: "Miami",
        guestCount: "10",
      });
      expect(validateLogisticsFields({ ...base, location: "" }, false)).toMatch(/city \/ venue is required/i);
      expect(validateLogisticsFields({ ...base, location: "A" }, false)).toMatch(/at least 2/i);
      expect(
        validateLogisticsFields({ ...base, location: "x".repeat(301) }, false),
      ).toMatch(/at most 300/i);
      expect(validateLogisticsFields({ ...base, eventAddress: "" }, false)).toMatch(
        /event address is required/i,
      );
      expect(validateLogisticsFields({ ...base, eventAddress: "1234" }, false)).toMatch(
        /at least 5/i,
      );
      expect(
        validateLogisticsFields({ ...base, eventAddress: "x".repeat(401) }, false),
      ).toMatch(/at most 400/i);
      expect(validateLogisticsFields({ ...base, guestCount: "" }, false)).toMatch(
        /guest count is required/i,
      );
      expect(validateLogisticsFields({ ...base, guestCount: "1.5" }, false)).toMatch(
        /whole number/i,
      );
      expect(validateLogisticsFields({ ...base, guestCount: "0" }, false)).toMatch(
        /between/i,
      );
      expect(validateLogisticsFields({ ...base, eventTimeStart: "" }, false)).toMatch(
        /start time/i,
      );
      expect(validateLogisticsFields({ ...base, eventTimeEnd: "" }, false)).toMatch(
        /end time/i,
      );
      expect(validateLogisticsFields({ ...base, eventTimeStart: "99:99" }, false)).toMatch(
        /invalid performance start/i,
      );
      expect(validateLogisticsFields({ ...base, eventTimeEnd: "99:99" }, false)).toMatch(
        /invalid performance end/i,
      );
      expect(
        validateLogisticsFields({ ...base, eventTimeStart: "22:00", eventTimeEnd: "19:00" }, false),
      ).toMatch(/after performance start/i);
      expect(validateLogisticsFields({ ...base, eventDate: "nope" }, false)).toMatch(
        /invalid event date/i,
      );
      expect(validateLogisticsFields({ ...base, eventDate: "2020-01-01" }, false)).toMatch(
        /cannot be in the past/i,
      );
      expect(
        validateLogisticsFields({ ...base, projectDeadlineNote: "x".repeat(501) }, true),
      ).toMatch(/at most 500/i);
      expect(
        validateLogisticsFields(
          { ...base, eventDate: "", projectDeadlineNote: "ok" },
          true,
        ),
      ).toMatch(/at least 5 characters/i);
      expect(
        validateLogisticsFields(
          makeWizardData({
            eventDate: "2030-08-01",
            eventTimeStart: "19:00",
            eventTimeEnd: "22:00",
            location: "Miami",
            eventAddress: "123 Ocean Drive",
            guestCount: "10",
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
