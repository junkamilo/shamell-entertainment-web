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
  MediaPickControl: ({
    disabled,
    onFileChange,
    selectedFileName,
  }: {
    disabled?: boolean;
    onFileChange: (file: File | null) => void;
    selectedFileName: string | null;
  }) => (
    <div data-testid="media-pick" data-disabled={String(Boolean(disabled))}>
      <span>{selectedFileName ?? "none"}</span>
      <button
        type="button"
        onClick={() =>
          onFileChange(new File(["x"], "hero.jpg", { type: "image/jpeg" }))
        }
      >
        pick-file
      </button>
    </div>
  ),
}));

vi.mock("./ServicesFormPreview", () => ({
  default: ({
    onRemoveSelectedFile,
    onRequestClearSavedMedia,
    onOpenLightbox,
  }: {
    onRemoveSelectedFile: () => void;
    onRequestClearSavedMedia: () => void;
    onOpenLightbox: () => void;
  }) => (
    <div data-testid="form-preview">
      <button type="button" onClick={onRemoveSelectedFile}>
        remove-selected
      </button>
      <button type="button" onClick={onRequestClearSavedMedia}>
        clear-saved
      </button>
      <button type="button" onClick={onOpenLightbox}>
        open-lightbox
      </button>
    </div>
  ),
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
    setIsTypeDropdownOpen: vi.fn((next: boolean | ((prev: boolean) => boolean)) => {
      if (typeof next === "function") next(false);
    }),
    setIsPreviewLightboxOpen: vi.fn(),
    activeServiceTypes: [makeServiceType(), makeServiceType({ id: "st-2", name: "Yachts" })],
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

  it("does not render when closed", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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

  it("shows edit title, Save changes, and Saving...", () => {
    renderModal({ editingId: "svc-1", isSubmitting: true });
    expect(screen.getByRole("dialog", { name: "Edit service" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saving..." })).toBeInTheDocument();
  });

  it("shows Save changes when editing and idle", () => {
    renderModal({ editingId: "svc-1", isSubmitting: false, canSubmit: true });
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
  });

  it("does not toggle type dropdown when types list is empty", async () => {
    const user = userEvent.setup();
    const { props } = renderModal({
      activeServiceTypes: [],
      selectedTypeName: undefined,
    });
    await user.click(screen.getByRole("button", { name: /SERVICE TYPE/i }));
    expect(props.setIsTypeDropdownOpen).not.toHaveBeenCalled();
  });

  it("toggles type dropdown and selects a type", async () => {
    const user = userEvent.setup();
    const { props } = renderModal({ isTypeDropdownOpen: false });
    await user.click(screen.getByRole("button", { name: /SERVICE TYPE/i }));
    expect(props.setIsTypeDropdownOpen).toHaveBeenCalled();
    const open = renderModal({ isTypeDropdownOpen: true });
    await user.click(screen.getByRole("button", { name: "Yachts" }));
    expect(open.props.setServiceTypeId).toHaveBeenCalledWith("st-2");
    expect(open.props.setIsTypeDropdownOpen).toHaveBeenCalledWith(false);
  });

  it("notifies field handlers and media pick/preview actions", async () => {
    const user = userEvent.setup();
    const file = new File(["x"], "hero.jpg", { type: "image/jpeg" });
    const { props } = renderModal({ image: file });
    await user.type(screen.getByPlaceholderText("Describe the service..."), "Hi");
    await user.type(screen.getByPlaceholderText(/Item 1/), "A");
    await user.type(screen.getByPlaceholderText("e.g. 2500 or 2500.50"), "1");
    expect(props.setDescription).toHaveBeenCalled();
    expect(props.setItemsText).toHaveBeenCalled();
    expect(props.setPriceInput).toHaveBeenCalled();

    expect(screen.getByTestId("media-pick")).toHaveAttribute("data-disabled", "false");
    await user.click(screen.getByRole("button", { name: "pick-file" }));
    expect(props.setImage).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "remove-selected" }));
    expect(props.setImage).toHaveBeenCalledWith(null);
    expect(props.setIsPreviewLightboxOpen).toHaveBeenCalledWith(false);
    expect(props.clearMediaFileInput).toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "clear-saved" }));
    expect(props.onRequestClearSavedMedia).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "open-lightbox" }));
    expect(props.setIsPreviewLightboxOpen).toHaveBeenCalledWith(true);
  });

  it("disables media pick while submitting or clearing", () => {
    renderModal({ isSubmitting: true });
    expect(screen.getByTestId("media-pick")).toHaveAttribute("data-disabled", "true");
    renderModal({ isClearingMedia: true });
    expect(screen.getAllByTestId("media-pick").at(-1)).toHaveAttribute(
      "data-disabled",
      "true",
    );
  });
});
