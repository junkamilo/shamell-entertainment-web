/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DefinitionList } from "./DefinitionList";

describe("DefinitionList", () => {
  it("returns null when fields are empty", () => {
    const { container } = render(<DefinitionList fields={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows emptyFallback for empty values", () => {
    render(
      <DefinitionList
        fields={[{ label: "Notes", value: "", emptyFallback: "None" }]}
      />,
    );
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("renders sectionTitle chrome", () => {
    const { container } = render(
      <DefinitionList
        sectionTitle="FORM DETAILS"
        fields={[{ label: "Name", value: "Ada" }]}
      />,
    );
    expect(screen.getByText("FORM DETAILS")).toBeInTheDocument();
    expect(container.firstElementChild?.className).toContain("shamell-glass-surface");
  });

  it("marks fullWidth fields", () => {
    const { container } = render(
      <DefinitionList
        fields={[
          { label: "Short", value: "A" },
          { label: "Long", value: "B", fullWidth: true },
        ]}
      />,
    );
    const full = Array.from(container.querySelectorAll("div")).find((el) =>
      el.className.includes("sm:col-span-2"),
    );
    expect(full).toBeTruthy();
    expect(full).toHaveTextContent("Long");
  });
});
