/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FIXTURE_OCCASION_TYPE_ID } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/overlays", () => ({
  Modal: ({
    isOpen,
    title,
    children,
    onClose,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
        <button type="button" onClick={onClose}>
          x
        </button>
      </div>
    ) : null,
}));

import OccasionTypesFormModal from "./OccasionTypesFormModal";

function renderModal(
  overrides: Partial<React.ComponentProps<typeof OccasionTypesFormModal>> = {},
) {
  const props: React.ComponentProps<typeof OccasionTypesFormModal> = {
    isOpen: true,
    editingId: null,
    name: "",
    onNameChange: vi.fn(),
    canSubmit: true,
    isSubmitting: false,
    onClose: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    ...overrides,
  };
  return {
    ...renderWithProviders(<OccasionTypesFormModal {...props} />),
    props,
  };
}

describe("OccasionTypesFormModal", () => {
  it("renders New occasion type title when creating", () => {
    renderModal();
    expect(
      screen.getByRole("dialog", { name: "New occasion type" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("renders Edit occasion type title when editing", () => {
    renderModal({
      editingId: FIXTURE_OCCASION_TYPE_ID,
      name: "Birthday",
    });
    expect(
      screen.getByRole("dialog", { name: "Edit occasion type" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("calls onClose from Cancel", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("notifies onNameChange when typing", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.type(
      screen.getByPlaceholderText("e.g. Luxury birthday"),
      "A",
    );
    expect(props.onNameChange).toHaveBeenCalled();
  });

  it("disables submit when canSubmit is false", () => {
    renderModal({ canSubmit: false });
    expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("shows Saving... while submitting", () => {
    renderModal({ isSubmitting: true, canSubmit: true });
    expect(screen.getByRole("button", { name: "Saving..." })).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
