/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FIXTURE_OCCASION_ID } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import ContactOccasionPickerModal from "./ContactOccasionPickerModal";

describe("ContactOccasionPickerModal", () => {
  it("lists occasion options when open", async () => {
    renderWithProviders(
      <ContactOccasionPickerModal
        isOpen
        title="What kind of occasion?"
        options={[{ id: FIXTURE_OCCASION_ID, name: "Wedding" }]}
        selectedId=""
        onClose={vi.fn()}
        onSelect={vi.fn()}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(screen.getByRole("option", { name: "Wedding" })).toBeInTheDocument();
  });

  it("calls onSelect and onClose when picking an option", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(
      <ContactOccasionPickerModal
        isOpen
        title="What kind of occasion?"
        options={[{ id: FIXTURE_OCCASION_ID, name: "Wedding" }]}
        selectedId=""
        onClose={onClose}
        onSelect={onSelect}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Wedding" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("option", { name: "Wedding" }));
    expect(onSelect).toHaveBeenCalledWith(FIXTURE_OCCASION_ID);
    expect(onClose).toHaveBeenCalled();
  });
});
