/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import TablePricingFields from "./TablePricingFields";

function renderFields(
  overrides: Partial<React.ComponentProps<typeof TablePricingFields>> = {},
) {
  const props: React.ComponentProps<typeof TablePricingFields> = {
    bundlePriceInput: "",
    onBundleChange: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<TablePricingFields {...props} />), props };
}

describe("TablePricingFields", () => {
  it("renders bundle price label and helper copy", () => {
    renderFields();
    expect(
      screen.getByText("Bundle price (table + included chairs)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/One package price for the table and all chairs/),
    ).toBeInTheDocument();
  });

  it("shows formatted preview for valid input", () => {
    renderFields({ bundlePriceInput: "250" });
    expect(screen.getByText("$250")).toBeInTheDocument();
  });

  it("calls onBundleChange when typing", async () => {
    const user = userEvent.setup();
    const { props } = renderFields({ bundlePriceInput: "100" });
    await user.type(screen.getByRole("textbox"), "0");
    expect(props.onBundleChange).toHaveBeenCalled();
  });
});
