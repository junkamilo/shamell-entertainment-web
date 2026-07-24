/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import {
  makeInquiryDetailRows,
  makeInquiryDetails,
} from "../test/fixtures/inquiries.fixture";
import { createMockInquiryDetailsProps } from "../test/helpers/mockInquiryDetails";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/data-display", () => ({
  DefinitionList: ({
    sectionTitle,
    fields,
  }: {
    sectionTitle?: string;
    fields: { label: string; value: string }[];
  }) => (
    <section data-testid="definition-list">
      <h2>{sectionTitle}</h2>
      <ul>
        {fields.map((f) => (
          <li key={f.label}>
            <span>{f.label}</span>: <span>{f.value}</span>
          </li>
        ))}
      </ul>
    </section>
  ),
}));

import {
  InquiryDetails,
  InquiryDetailsReadable,
} from "./InquiryDetails";

describe("InquiryDetailsReadable", () => {
  it("renders rows built from details", () => {
    renderWithProviders(
      <InquiryDetailsReadable {...createMockInquiryDetailsProps()} />,
    );

    expect(screen.getByTestId("definition-list")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "FORM DETAILS" })).toBeInTheDocument();
    expect(screen.getByText("Event type")).toBeInTheDocument();
    expect(screen.getByText("Private weddings")).toBeInTheDocument();
  });

  it("prefers pre-built rows over details", () => {
    renderWithProviders(
      <InquiryDetailsReadable
        details={makeInquiryDetails()}
        rows={makeInquiryDetailRows([
          { label: "Custom row", value: "From rows prop" },
        ])}
      />,
    );

    expect(screen.getByText("Custom row")).toBeInTheDocument();
    expect(screen.getByText("From rows prop")).toBeInTheDocument();
    expect(screen.queryByText("Private weddings")).not.toBeInTheDocument();
  });

  it("returns null when there are no rows", () => {
    const { container } = renderWithProviders(
      <InquiryDetailsReadable details={{}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("uses custom sectionTitle", () => {
    renderWithProviders(
      <InquiryDetailsReadable
        rows={makeInquiryDetailRows()}
        sectionTitle="BOOKING DETAILS"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "BOOKING DETAILS" }),
    ).toBeInTheDocument();
  });

  it("InquiryDetails alias still renders", () => {
    renderWithProviders(
      <InquiryDetails rows={makeInquiryDetailRows([{ label: "A", value: "B" }])} />,
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
