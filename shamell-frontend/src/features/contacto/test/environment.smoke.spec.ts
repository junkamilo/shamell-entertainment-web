import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import { fetchOccupiedRanges } from "../services/fetchOccupiedRanges";
import { submitContactInquiry } from "../services/submitContactInquiry";
import { fetchPublicContactLines } from "../services/fetchPublicContactLines";
import {
  makeContactLine,
  makeContactLinesApiPayload,
  makeWizardData,
} from "./fixtures/contacto.fixture";
import { FIXTURE_CONTACT_LINE_ID } from "./fixtures/uuids.fixture";
import { createMockContactInquiryFormState } from "./helpers/mockContactoPage";
import { contactLinesListHandler } from "./mocks/handlers";

describe("contacto test environment", () => {
  it("exposes usable fixtures and form mock", () => {
    expect(makeContactLine().id).toBe(FIXTURE_CONTACT_LINE_ID);
    expect(makeContactLinesApiPayload()).toHaveLength(1);
    expect(makeWizardData().email).toBe("ada@example.com");

    const form = createMockContactInquiryFormState({ submitting: true });
    expect(form.submitting).toBe(true);
    form.goNext();
    expect(form.goNext).toHaveBeenCalled();
  });

  it("serves contact submit, occupied ranges, and contact-lines via MSW", async () => {
    server.use(contactLinesListHandler());

    const lines = await fetchPublicContactLines();
    expect(lines[0]?.id).toBe(FIXTURE_CONTACT_LINE_ID);

    const occupied = await fetchOccupiedRanges("2030-08-01");
    expect(occupied[0]?.startMinutes).toBe(600);

    const submitted = await submitContactInquiry({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      message: "Hello",
      inquiryDetails: {},
    });
    expect(submitted.ok).toBe(true);
  });
});
