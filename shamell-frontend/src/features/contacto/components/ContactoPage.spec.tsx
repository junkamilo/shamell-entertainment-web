/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/SiteHeader", () => ({
  default: () => <header data-testid="site-header" />,
}));

vi.mock("@/components/Footer", () => ({
  default: () => <footer data-testid="site-footer" />,
}));

vi.mock("./ContactInquiryGate", () => ({
  default: () => <div data-testid="contact-inquiry-gate" />,
}));

vi.mock("./ContactFormFallback", () => ({
  default: () => <div data-testid="contact-form-fallback" />,
}));

import ContactoPage from "./ContactoPage";

describe("ContactoPage", () => {
  it("renders shell and inquiry gate", () => {
    renderWithProviders(<ContactoPage />);
    expect(screen.getByTestId("site-header")).toBeInTheDocument();
    expect(screen.getByTestId("contact-inquiry-gate")).toBeInTheDocument();
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
  });
});
