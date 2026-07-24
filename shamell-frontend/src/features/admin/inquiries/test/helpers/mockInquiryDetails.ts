import {
  makeInquiryDetailRows,
  makeInquiryDetails,
} from "../fixtures/inquiries.fixture";
import type { InquiryDetailsReadableProps } from "../../components/InquiryDetails";

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
