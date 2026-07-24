/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import ContactDatePickerModal from "./ContactDatePickerModal";

describe("ContactDatePickerModal", () => {
  it("renders calendar title when open", async () => {
    renderWithProviders(
      <ContactDatePickerModal
        isOpen
        title="Event date"
        value=""
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        minSelectableIso="2030-01-01"
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(screen.getByText("Event date")).toBeInTheDocument();
  });

  it("calls onClose from Cancel", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <ContactDatePickerModal
        isOpen
        title="Event date"
        value=""
        onClose={onClose}
        onConfirm={vi.fn()}
        minSelectableIso="2030-01-01"
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});
