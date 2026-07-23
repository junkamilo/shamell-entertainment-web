/** @vitest-environment jsdom */

import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeServiceType } from "../test/fixtures/services.fixture";
import { FIXTURE_SERVICE_TYPE_ID } from "../test/fixtures/uuids.fixture";
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

vi.mock("@/components/admin/media", () => ({
  MediaPickControl: () => <div data-testid="media-pick" />,
}));

vi.mock("./ServicesFormPreview", () => ({
  default: () => null,
}));

import ServicesFormModal from "./ServicesFormModal";

function renderModal(
  overrides: Partial<React.ComponentProps<typeof ServicesFormModal>> = {},
) {
  const props: React.ComponentProps<typeof ServicesFormModal> = {
    isOpen: true,
    isSubmitting: false,
    isClearingMedia: false,
    editingId: null,
    canSubmit: true,
    serviceTypeId: FIXTURE_SERVICE_TYPE_ID,
    setServiceTypeId: vi.fn(),
    description: "",
    setDescription: vi.fn(),
    itemsText: "",
    setItemsText: vi.fn(),
    priceInput: "",
    setPriceInput: vi.fn(),
    image: null,
    setImage: vi.fn(),
    imagePreviewUrl: null,
    existingImageUrl: null,
    formPreviewMediaIsVideo: false,
    isTypeDropdownOpen: false,
    setIsTypeDropdownOpen: vi.fn(),
    setIsPreviewLightboxOpen: vi.fn(),
    activeServiceTypes: [makeServiceType()],
    selectedTypeName: "Performance",
    mediaFileInputRef: createRef<HTMLInputElement>(),
    clearMediaFileInput: vi.fn(),
    onClose: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    onRequestClearSavedMedia: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<ServicesFormModal {...props} />), props };
}

describe("ServicesFormModal", () => {
  it("shows New service title when open", () => {
    renderModal();
    expect(
      screen.getByRole("dialog", { name: "New service" }),
    ).toBeInTheDocument();
  });

  it("calls onClose from Cancel", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onClose).toHaveBeenCalledOnce();
  });

  it("submits when canSubmit is true", async () => {
    const user = userEvent.setup();
    const { props } = renderModal({ canSubmit: true });

    await user.click(screen.getByRole("button", { name: "Create service" }));
    expect(props.onSubmit).toHaveBeenCalledOnce();
  });

  it("disables submit when canSubmit is false", () => {
    renderModal({ canSubmit: false });
    expect(screen.getByRole("button", { name: "Create service" })).toBeDisabled();
  });
});
