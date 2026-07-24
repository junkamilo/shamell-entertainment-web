/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockUseContactInquiryFormReturn } from "../test/helpers/mockContactoPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

const formMock = vi.hoisted(() => ({
  useContactInquiryForm: vi.fn(),
}));

vi.mock("../hooks/useContactInquiryForm", () => ({
  useContactInquiryForm: formMock.useContactInquiryForm,
}));

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => false,
}));

vi.mock("@/components/shared/RevealFromDepth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("./CatalogOfferingDetailModal", () => ({ default: () => null }));
vi.mock("./ContactDatePickerModal", () => ({ default: () => null }));
vi.mock("./ContactTimePickerModal", () => ({ default: () => null }));
vi.mock("./ContactOccasionPickerModal", () => ({ default: () => null }));
vi.mock("./InquirySubmitFeedbackLayer", () => ({ default: () => null }));

import ContactInquiryForm from "./ContactInquiryForm";

describe("ContactInquiryForm", () => {
  it("renders booking inquiry header and progress nav", () => {
    formMock.useContactInquiryForm.mockReturnValue(
      createMockUseContactInquiryFormReturn(),
    );
    renderWithProviders(<ContactInquiryForm entrySource="contact_page" />);
    expect(screen.getByRole("heading", { name: /booking/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Form progress" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /1\. offering/i })).toBeInTheDocument();
  });

  it("shows loading state for contact lines", () => {
    formMock.useContactInquiryForm.mockReturnValue(
      createMockUseContactInquiryFormReturn({
        catalog: {
          ...createMockUseContactInquiryFormReturn().catalog,
          linesLoading: true,
        },
      }),
    );
    renderWithProviders(<ContactInquiryForm entrySource="contact_page" />);
    expect(screen.getByText(/loading offerings/i)).toBeInTheDocument();
  });
});
