/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import ContactFormFallback from "./ContactFormFallback";

describe("ContactFormFallback", () => {
  it("shows loading message", () => {
    renderWithProviders(<ContactFormFallback />);
    expect(screen.getByText("Loading form…")).toBeInTheDocument();
  });
});
