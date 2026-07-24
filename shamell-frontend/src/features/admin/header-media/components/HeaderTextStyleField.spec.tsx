/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/inputs", () => ({
  AccordionSingleSelect: ({
    ariaLabel,
    onChange,
  }: {
    ariaLabel: string;
    onChange: (id: string) => void;
  }) => (
    <button type="button" aria-label={ariaLabel} onClick={() => onChange("elegant")}>
      font
    </button>
  ),
}));

import HeaderTextStyleField from "./HeaderTextStyleField";

function renderField(
  overrides: Partial<React.ComponentProps<typeof HeaderTextStyleField>> = {},
) {
  const props: React.ComponentProps<typeof HeaderTextStyleField> = {
    label: "TITLE",
    text: "SHAMELL",
    onTextChange: vi.fn(),
    font: "brand",
    onFontChange: vi.fn(),
    color: "#c5a55a",
    onColorChange: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<HeaderTextStyleField {...props} />), props };
}

describe("HeaderTextStyleField", () => {
  it("renders label and text value", () => {
    renderField();
    expect(screen.getByText("TITLE")).toBeInTheDocument();
    expect(screen.getByDisplayValue("SHAMELL")).toBeInTheDocument();
  });

  it("notifies onTextChange", async () => {
    const user = userEvent.setup();
    const { props } = renderField();
    await user.type(screen.getByDisplayValue("SHAMELL"), "X");
    expect(props.onTextChange).toHaveBeenCalled();
  });

  it("notifies onFontChange", async () => {
    const user = userEvent.setup();
    const { props } = renderField();
    await user.click(screen.getByRole("button", { name: "TITLE font" }));
    expect(props.onFontChange).toHaveBeenCalledWith("elegant");
  });

  it("shows invalid color hint", () => {
    renderField({ color: "bad" });
    expect(screen.getByText("Use format #RRGGBB")).toBeInTheDocument();
  });

  it("renders textarea when multiline", () => {
    renderField({ multiline: true, rows: 2, text: "Tagline" });
    expect(screen.getByDisplayValue("Tagline").tagName).toBe("TEXTAREA");
  });
});
