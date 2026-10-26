import { describe, expect, it } from "vitest";
import { server } from "@test/support/server";
import { fetchOccupiedRanges } from "@/features/contacto/services/fetchOccupiedRanges";
import { submitContactInquiry } from "@/features/contacto/services/submitContactInquiry";
import { fetchPublicContactLines } from "@/features/contacto/services/fetchPublicContactLines";
import {
  makeContactLine,
  makeContactLinesApiPayload,
  makeWizardData,
} from "@test/features/contacto/support/fixtures/contacto.fixture";
import { FIXTURE_CONTACT_LINE_ID } from "@test/features/contacto/support/fixtures/uuids.fixture";
import { createMockContactInquiryFormState } from "@test/features/contacto/support/helpers/mockContactoPage";
import { contactLinesListHandler } from "@test/features/contacto/support/mocks/handlers";

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
      recaptchaToken: "test-recaptcha-token-ok-xx",
      inquiryDetails: {},
    });
    expect(submitted.ok).toBe(true);
  });
});
