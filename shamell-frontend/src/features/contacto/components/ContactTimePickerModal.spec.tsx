/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/ShamellTime12hColumns", () => ({
  default: () => <div data-testid="time-columns" />,
}));

import ContactTimePickerModal from "./ContactTimePickerModal";

describe("ContactTimePickerModal", () => {
  it("renders time picker title when open", async () => {
    renderWithProviders(
      <ContactTimePickerModal
        isOpen
        title="Performance start"
        value="19:00"
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(screen.getByText("Performance start")).toBeInTheDocument();
  });

  it("calls onClose from Cancel", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <ContactTimePickerModal
        isOpen
        title="Performance end"
        value="22:00"
        onClose={onClose}
        onConfirm={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});
