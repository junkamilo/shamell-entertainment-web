/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/inputs", () => ({
  MultiSelect: ({
    options,
    ariaLabel,
    emptyDisplay,
  }: {
    options: Array<{ id: string; label: string }>;
    ariaLabel?: string;
    emptyDisplay?: string;
  }) => (
    <select aria-label={ariaLabel ?? "Services"}>
      <option value="">{emptyDisplay ?? "Select services"}</option>
      {options.map((o) => (
        <option key={o.id} value={o.id}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

import ServicesMultiSelect from "./ServicesMultiSelect";

describe("ServicesMultiSelect", () => {
  it("renders with options via MultiSelect stub", () => {
    renderWithProviders(
      <ServicesMultiSelect
        options={[
          { id: "a", label: "Show package" },
          { id: "b", label: "Private class" },
        ]}
        value={[]}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Services" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Show package" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Private class" })).toBeInTheDocument();
  });
});
