import {
  makeInquiryDetailRows,
  makeInquiryDetails,
} from "@test/features/admin/inquiries/support/fixtures/inquiries.fixture";
import type { InquiryDetailsReadableProps } from "@/features/admin/inquiries/components/InquiryDetails";

export function createMockInquiryDetailsProps(
  overrides: Partial<InquiryDetailsReadableProps> = {},
): InquiryDetailsReadableProps {
  return {
    details: makeInquiryDetails(),
    viewer: "admin",
    sectionTitle: "FORM DETAILS",
    ...overrides,
  };
}

export function createMockInquiryRowsProps(
  overrides: Partial<InquiryDetailsReadableProps> = {},
): InquiryDetailsReadableProps {
  return {
    rows: makeInquiryDetailRows(),
    sectionTitle: "FORM DETAILS",
    ...overrides,
  };
}
