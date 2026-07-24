import { describe, expect, it } from "vitest";
import {
  buildInquiryDetailRows,
  formatAdminServiceType,
} from "./buildInquiryDetailRows";
import {
  makeConciergeInquiryDetails,
  makeInquiryDetails,
  makeTechnicalInquiryDetails,
} from "../test/fixtures/inquiries.fixture";
import {
  FIXTURE_EVENT_ID,
  FIXTURE_SERVICE_ID,
} from "../test/fixtures/uuids.fixture";

function labels(rows: { label: string; value: string }[]) {
  return rows.map((r) => r.label);
}

function valueOf(rows: { label: string; value: string }[], label: string) {
  return rows.find((r) => r.label === label)?.value;
}

describe("formatAdminServiceType", () => {
  it("returns empty for blank codes", () => {
    expect(formatAdminServiceType(null)).toBe("");
    expect(formatAdminServiceType("   ")).toBe("");
  });

  it("maps known service type codes", () => {
    expect(formatAdminServiceType("PRIVATE_GALA")).toBe(
      "Private gala / social events",
    );
    expect(formatAdminServiceType("VIP_EVENT")).toBe("VIP events");
    expect(formatAdminServiceType("BESPOKE")).toBe("Bespoke collaborations");
    expect(formatAdminServiceType("GENERAL")).toBe("General inquiry");
  });

  it("title-cases unknown codes", () => {
    expect(formatAdminServiceType("CUSTOM_CODE")).toBe("Custom Code");
  });
});

describe("buildInquiryDetailRows", () => {
  it("returns empty for null undefined non-objects and arrays", () => {
    expect(buildInquiryDetailRows(null)).toEqual([]);
    expect(buildInquiryDetailRows(undefined)).toEqual([]);
    expect(buildInquiryDetailRows("x")).toEqual([]);
    expect(buildInquiryDetailRows([])).toEqual([]);
  });

  it("maps core admin-facing fields from fixture", () => {
    const rows = buildInquiryDetailRows(makeInquiryDetails());
    expect(valueOf(rows, "Planning stage")).toBe("Date or venue in mind");
    expect(valueOf(rows, "Occasion idea")).toBe("Rooftop evening");
    expect(valueOf(rows, "Vision summary")).toContain("Elegant belly dance");
    expect(valueOf(rows, "Event type")).toBe("Private weddings");
    expect(valueOf(rows, "Occasion type")).toBe("Anniversary");
    expect(valueOf(rows, "Experience add-ons")).toContain("Fire performance");
    expect(valueOf(rows, "Services selected")).toContain("Solo performance");
    expect(valueOf(rows, "Guide investment (USD)")).toBe("$2,500");
    expect(valueOf(rows, "Requested time")).toBe("19:00 – 22:00");
    expect(valueOf(rows, "Guests (approx.)")).toBe("80");
    expect(valueOf(rows, "Event address")).toBe("123 Ocean Ave");
    expect(valueOf(rows, "Venue")).toBe("Indoor");
  });

  it("hides raw entry source for admin viewer", () => {
    const rows = buildInquiryDetailRows(
      makeInquiryDetails({ entrySource: "home_service_card" }),
    );
    expect(labels(rows)).not.toContain("Form entry source");
  });

  it("shows entry source for technical viewer", () => {
    const rows = buildInquiryDetailRows(
      makeInquiryDetails({ entrySource: "home_service_card" }),
      { viewer: "technical" },
    );
    expect(valueOf(rows, "Form entry source")).toBe("Card from home");
  });

  it("labels concierge gate requests", () => {
    const rows = buildInquiryDetailRows(makeConciergeInquiryDetails());
    expect(valueOf(rows, "Request type")).toBe("Concierge guidance");
    expect(valueOf(rows, "Concierge request")).toBe("Client needs guidance");
  });

  it("maps catalog selection titles", () => {
    expect(
      valueOf(
        buildInquiryDetailRows(
          makeInquiryDetails({
            sourceCatalogKind: "service",
            sourceCatalogTitle: "Fire show",
          }),
        ),
        "Service selected on site",
      ),
    ).toBe("Fire show");

    expect(
      valueOf(
        buildInquiryDetailRows(
          makeInquiryDetails({
            sourceCatalogKind: "event",
            sourceCatalogTitle: "Gala night",
          }),
        ),
        "Event selected on site",
      ),
    ).toBe("Gala night");
  });

  it("shows legacy occasion code and free text", () => {
    const rows = buildInquiryDetailRows(
      makeInquiryDetails({
        occasionSingleLabel: undefined,
        occasionCode: "WEDDING",
        occasionOther: "Custom celebration",
      }),
    );
    expect(valueOf(rows, "Occasion type (legacy code)")).toBe("Wedding");
    expect(valueOf(rows, "Occasion (free text)")).toBe("Custom celebration");
  });

  it("maps bespoke project and role labels", () => {
    const rows = buildInquiryDetailRows(
      makeInquiryDetails({
        bespokeProjectLabels: ["Film", "Campaign"],
        bespokeRoleLabels: ["Choreographer"],
        projectDeadlineNote: "Q3 window",
      }),
    );
    expect(valueOf(rows, "Bespoke projects")).toBe("Film · Campaign");
    expect(valueOf(rows, "Roles / collaboration")).toBe("Choreographer");
    expect(valueOf(rows, "Timeline or window")).toBe("Q3 window");
  });

  it("falls back to legacy bespoke codes and technical ids", () => {
    const adminRows = buildInquiryDetailRows(
      makeInquiryDetails({
        bespokeProjectLabels: [],
        bespokeRoleLabels: [],
        bespokeProjectTypes: ["BRAND_FILM"],
        bespokeRoles: ["CHOREOGRAPHER"],
        occasionTypeIdsProject: ["id-1"],
        occasionTypeIdsRole: ["id-2"],
      }),
    );
    expect(valueOf(adminRows, "Project type (legacy)")).toBe("Brand Film");
    expect(valueOf(adminRows, "Role / collaboration (legacy)")).toBe(
      "Choreographer",
    );
    expect(labels(adminRows)).not.toContain("Bespoke projects (ids)");

    const techRows = buildInquiryDetailRows(
      makeInquiryDetails({
        bespokeProjectLabels: [],
        bespokeRoleLabels: [],
        bespokeProjectTypes: [],
        bespokeRoles: [],
        occasionTypeIdsProject: ["id-1"],
        occasionTypeIdsRole: ["id-2"],
      }),
      { viewer: "technical" },
    );
    expect(valueOf(techRows, "Bespoke projects (ids)")).toBe("id-1");
    expect(valueOf(techRows, "Bespoke roles (ids)")).toBe("id-2");
  });

  it("shows technical ids and service ids only for technical viewer", () => {
    const adminRows = buildInquiryDetailRows(makeTechnicalInquiryDetails());
    expect(labels(adminRows)).not.toContain("Event (id)");
    expect(labels(adminRows)).not.toContain("Service ids");

    const techRows = buildInquiryDetailRows(
      makeTechnicalInquiryDetails({
        serviceLabels: [],
      }),
      { viewer: "technical" },
    );
    expect(valueOf(techRows, "Event (id)")).toBe(FIXTURE_EVENT_ID);
    expect(valueOf(techRows, "Service ids")).toBe(FIXTURE_SERVICE_ID);
  });

  it("marks partial guide estimate and outdoor venue", () => {
    const rows = buildInquiryDetailRows(
      makeInquiryDetails({
        guideInvestmentIsPartial: true,
        venueIndoor: false,
      }),
    );
    expect(valueOf(rows, "Guide estimate")).toBe("Partial (catalog incomplete)");
    expect(valueOf(rows, "Venue")).toBe("Outdoor");
  });

  it("appends unknown scalar and object keys", () => {
    const rows = buildInquiryDetailRows(
      makeInquiryDetails({
        custom_note: "hello",
        nested_meta: { a: 1 },
      }),
    );
    expect(valueOf(rows, "Custom Note")).toBe("hello");
    expect(valueOf(rows, "Nested Meta")).toBe('{"a":1}');
  });

  it("skips empty strings and formats booleans", () => {
    const rows = buildInquiryDetailRows({
      visionSummary: "   ",
      custom_flag: true,
      custom_off: false,
    });
    expect(labels(rows)).not.toContain("Vision summary");
    expect(valueOf(rows, "Custom Flag")).toBe("Yes");
    expect(valueOf(rows, "Custom Off")).toBe("No");
  });
});
