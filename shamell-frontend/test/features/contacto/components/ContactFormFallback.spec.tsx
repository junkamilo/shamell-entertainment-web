/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/contacto/support/helpers/renderWithProviders";
import ContactFormFallback from "@/features/contacto/components/ContactFormFallback";

describe("ContactFormFallback", () => {
  it("shows loading message", () => {
    renderWithProviders(<ContactFormFallback />);
    expect(screen.getByText("Loading form…")).toBeInTheDocument();
  });
});
