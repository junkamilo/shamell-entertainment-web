import { describe, expect, it } from "vitest";
import { buildInquiryDetailRows } from "../lib/buildInquiryDetailRows";
import {
  makeInquiryDetailRows,
  makeInquiryDetails,
} from "./fixtures/inquiries.fixture";
import { createMockInquiryDetailsProps } from "./helpers/mockInquiryDetails";

describe("inquiries test environment", () => {
  it("exposes usable fixtures and detail props mock", () => {
    const details = makeInquiryDetails();
    expect(details.eventTypeLabel).toBe("Private weddings");
    expect(makeInquiryDetailRows()).toHaveLength(2);

    const props = createMockInquiryDetailsProps({ sectionTitle: "DETAILS" });
    expect(props.sectionTitle).toBe("DETAILS");
    expect(props.viewer).toBe("admin");
  });

  it("maps fixture details into labeled rows", () => {
    const rows = buildInquiryDetailRows(makeInquiryDetails());
    expect(rows.some((r) => r.label === "Event type")).toBe(true);
    expect(rows.some((r) => r.label === "Guests (approx.)" && r.value === "80")).toBe(
      true,
    );
  });
});
