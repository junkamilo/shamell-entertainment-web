/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import { ClassSectionFields } from "./ClassSectionFields";

const section = {
  label: "Beginner",
  startTime: "19:00",
  endTime: "20:00",
  sortOrder: 0,
  defaultCapacity: "20",
  defaultPrice: "25",
};

describe("ClassSectionFields", () => {
  it("renders section fields", () => {
    renderWithProviders(
      <ClassSectionFields
        section={section}
        sectionIndex={0}
        showRemove={false}
        onPatch={vi.fn()}
        onPickTime={vi.fn()}
      />,
    );
    expect(screen.getByText("Section 1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Beginner")).toBeInTheDocument();
    expect(screen.getByDisplayValue("20")).toBeInTheDocument();
    expect(screen.getByDisplayValue("25")).toBeInTheDocument();
    expect(screen.getByText(/7:00 PM/i)).toBeInTheDocument();
  });

  it("calls onPatch when label changes", async () => {
    const user = userEvent.setup();
    const onPatch = vi.fn();
    renderWithProviders(
      <ClassSectionFields
        section={section}
        sectionIndex={0}
        showRemove={false}
        onPatch={onPatch}
        onPickTime={vi.fn()}
      />,
    );
    await user.clear(screen.getByDisplayValue("Beginner"));
    await user.type(screen.getByPlaceholderText("e.g. Morning class"), "Advanced");
    expect(onPatch).toHaveBeenCalled();
  });

  it("calls onPickTime for start and end buttons", async () => {
    const user = userEvent.setup();
    const onPickTime = vi.fn();
    renderWithProviders(
      <ClassSectionFields
        section={section}
        sectionIndex={0}
        showRemove
        onPatch={vi.fn()}
        onRemove={vi.fn()}
        onPickTime={onPickTime}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Start/i }));
    expect(onPickTime).toHaveBeenCalledWith("start");
    await user.click(screen.getByRole("button", { name: /End/i }));
    expect(onPickTime).toHaveBeenCalledWith("end");
  });

  it("calls onRemove when remove button is shown", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    renderWithProviders(
      <ClassSectionFields
        section={section}
        sectionIndex={0}
        showRemove
        onPatch={vi.fn()}
        onRemove={onRemove}
        onPickTime={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Remove section 1" }));
    expect(onRemove).toHaveBeenCalled();
  });
});
