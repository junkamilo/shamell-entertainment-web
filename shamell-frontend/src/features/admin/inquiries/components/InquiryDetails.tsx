import { DefinitionList } from "@/components/admin/data-display";
import {
  buildInquiryDetailRows,
  type InquiryDetailRow,
  type InquiryDetailViewer,
} from "../lib/buildInquiryDetailRows";

export type InquiryDetailsReadableProps = {
  details?: unknown;
  rows?: InquiryDetailRow[];
  viewer?: InquiryDetailViewer;
  sectionTitle?: string;
};

/**
 * Domain display: maps inquiry JSON (or pre-built rows) into DefinitionList.
 * Prefer pre-built `rows` when the caller already ran a domain mapper.
 */
export function InquiryDetailsReadable({
  details,
  rows: rowsProp,
  viewer = "admin",
  sectionTitle = "FORM DETAILS",
}: InquiryDetailsReadableProps) {
  const rows = rowsProp ?? buildInquiryDetailRows(details, { viewer });
  if (rows.length === 0) return null;

  return (
    <DefinitionList
      sectionTitle={sectionTitle}
      fields={rows.map((row) => ({ label: row.label, value: row.value }))}
    />
  );
}

/** @deprecated Prefer InquiryDetailsReadable until CRM rename settles */
export const InquiryDetails = InquiryDetailsReadable;
