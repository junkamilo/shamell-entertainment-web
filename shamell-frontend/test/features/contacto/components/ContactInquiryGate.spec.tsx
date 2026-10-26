/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/contacto/support/helpers/renderWithProviders";

const gateMock = vi.hoisted(() => ({
  useContactInquiryGate: vi.fn(),
}));

vi.mock("@/features/contacto/hooks/useContactInquiryGate", () => ({
  useContactInquiryGate: gateMock.useContactInquiryGate,
}));

vi.mock("@/features/contacto/components/ContactInquiryForm", () => ({
  default: () => <div data-testid="contact-inquiry-form" />,
}));

vi.mock("@/features/contacto/components/ConciergeGate", () => ({
  default: () => <div data-testid="concierge-gate" />,
}));

vi.mock("@/features/contacto/components/ConciergeInquiryForm", () => ({
  default: () => <div data-testid="concierge-inquiry-form" />,
}));

import ContactInquiryGate from "@/features/contacto/components/ContactInquiryGate";

describe("ContactInquiryGate", () => {
  it("renders concierge gate by default", () => {
    gateMock.useContactInquiryGate.mockReturnValue({ view: "concierge_gate" });
    renderWithProviders(<ContactInquiryGate />);
    expect(screen.getByTestId("concierge-gate")).toBeInTheDocument();
  });

  it("renders concierge form when mode is concierge", () => {
    gateMock.useContactInquiryGate.mockReturnValue({ view: "concierge_form" });
    renderWithProviders(<ContactInquiryGate />);
    expect(screen.getByTestId("concierge-inquiry-form")).toBeInTheDocument();
  });

  it("renders booking inquiry form", () => {
    gateMock.useContactInquiryGate.mockReturnValue({
      view: "booking_form",
      formProps: { entrySource: "contact_page" },
    });
    renderWithProviders(<ContactInquiryGate />);
    expect(screen.getByTestId("contact-inquiry-form")).toBeInTheDocument();
  });
});
