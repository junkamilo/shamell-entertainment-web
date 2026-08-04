/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DateField } from "./DateField";

describe("DateField", () => {
  it("renders the label and date input", () => {
    render(<DateField label="Event date" value="2030-01-15" onChange={vi.fn()} />);
    expect(screen.getByText("Event date")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2030-01-15")).toBeInTheDocument();
  });

  it("calls onChange when the value changes", () => {
    const onChange = vi.fn();
    render(<DateField label="Event date" value="2030-01-15" onChange={onChange} />);
    fireEvent.change(screen.getByDisplayValue("2030-01-15"), {
      target: { value: "2030-02-01" },
    });
    expect(onChange).toHaveBeenCalledWith("2030-02-01");
  });

  it("respects disabled", () => {
    render(
      <DateField label="Event date" value="2030-01-15" onChange={vi.fn()} disabled />,
    );
    expect(screen.getByDisplayValue("2030-01-15")).toBeDisabled();
  });
});
