/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { AboutEditModal } from "./AboutEditModal";
import { makeAdminAboutRow } from "../test/fixtures/about.fixture";

vi.mock("@/components/admin/media", () => ({
  MediaPickControl: ({
    onFileChange,
    disabled,
  }: {
    onFileChange: (file: File | null) => void;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onFileChange(new File(["x"], "hero.jpg", { type: "image/jpeg" }))}
    >
      pick-file
    </button>
  ),
}));

vi.mock("./AboutHeroPreviewCard", () => ({
  AboutHeroPreviewCard: ({
    badge,
    onRemove,
    onExpand,
  }: {
    badge: string;
    onRemove: () => void;
    onExpand: () => void;
  }) => (
    <div>
      <span>{badge}</span>
      <button type="button" onClick={onRemove}>
        remove-{badge}
      </button>
      <button type="button" onClick={onExpand}>
        expand-{badge}
      </button>
    </div>
  ),
}));

function renderModal(
  overrides: Partial<React.ComponentProps<typeof AboutEditModal>> = {},
) {
  const props: React.ComponentProps<typeof AboutEditModal> = {
    record: makeAdminAboutRow(),
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn((e) => e.preventDefault()),
    title: "ABOUT SHAMELL",
    setTitle: vi.fn(),
    paragraph1: "Body",
    setParagraph1: vi.fn(),
    coreValuesText: "Excellence",
    setCoreValuesText: vi.fn(),
    existingImageUrl: null,
    existingHeroMediaType: "IMAGE",
    imageFile: null,
    setImageFile: vi.fn(),
    imagePreviewUrl: null,
    imageFileInputRef: createRef<HTMLInputElement>(),
    isSubmitting: false,
    isDeletingHero: false,
    onOpenDeleteHeroConfirm: vi.fn(),
    onDiscardSelectedFile: vi.fn(),
    onOpenLightbox: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<AboutEditModal {...props} />), props };
}

describe("AboutEditModal", () => {
  it("shows edit title for an existing record", async () => {
    renderModal();
    expect(
      await screen.findByRole("heading", { name: /edit about shamell/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Optional: upload a new image/)).toBeInTheDocument();
  });

  it("shows create copy when there is no record", async () => {
    renderModal({ record: null });
    expect(
      await screen.findByRole("heading", { name: /create about shamell/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/First publish requires a hero file/)).toBeInTheDocument();
  });

  it("notifies setters when the user types", async () => {
    const user = userEvent.setup();
    const setTitle = vi.fn();
    const setParagraph1 = vi.fn();
    const setCoreValuesText = vi.fn();
    renderModal({ setTitle, setParagraph1, setCoreValuesText, title: "" });

    await user.type(screen.getByLabelText(/title/i), "X");
    await user.type(screen.getByLabelText(/texto principal/i), "Y");
    await user.type(screen.getByLabelText(/values/i), "Z");
    expect(setTitle).toHaveBeenCalled();
    expect(setParagraph1).toHaveBeenCalled();
    expect(setCoreValuesText).toHaveBeenCalled();
  });

  it("picks a hero file", async () => {
    const user = userEvent.setup();
    const setImageFile = vi.fn();
    renderModal({ setImageFile });
    await user.click(screen.getByText("pick-file"));
    expect(setImageFile).toHaveBeenCalled();
  });

  it("disables Save while submitting", () => {
    renderModal({ isSubmitting: true });
    expect(screen.getByRole("button", { name: /saving/i })).toBeDisabled();
  });

  it("disables Save while deleting hero", () => {
    renderModal({ isDeletingHero: true });
    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
  });

  it("calls onSubmit when Save is clicked", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    renderModal({ onSubmit });

    await user.click(screen.getByRole("button", { name: /^save$/i }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("calls onClose from Cancel", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("previews only the live hero", async () => {
    const user = userEvent.setup();
    const { props } = renderModal({
      existingImageUrl: "https://cdn.example.com/live.jpg",
    });
    expect(screen.getByText("Live on site")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "remove-Live on site" }));
    expect(props.onOpenDeleteHeroConfirm).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "expand-Live on site" }));
    expect(props.onOpenLightbox).toHaveBeenCalledWith(
      "https://cdn.example.com/live.jpg",
      false,
    );
  });

  it("previews only the new file", async () => {
    const user = userEvent.setup();
    const file = new File(["x"], "new.mp4", { type: "video/mp4" });
    const { props } = renderModal({
      imagePreviewUrl: "blob:new",
      imageFile: file,
    });
    expect(screen.getByText("New file")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "remove-New file" }));
    expect(props.onDiscardSelectedFile).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "expand-New file" }));
    expect(props.onOpenLightbox).toHaveBeenCalledWith("blob:new", true);
  });

  it("previews live and pending files together", async () => {
    const user = userEvent.setup();
    const file = new File(["x"], "new.jpg", { type: "image/jpeg" });
    const { props } = renderModal({
      existingImageUrl: "https://cdn.example.com/live.mp4",
      existingHeroMediaType: "VIDEO",
      imagePreviewUrl: "blob:pending",
      imageFile: file,
    });
    expect(screen.getByText("Live on site")).toBeInTheDocument();
    expect(screen.getByText("New file (not saved)")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "expand-Live on site" }));
    expect(props.onOpenLightbox).toHaveBeenCalledWith(
      "https://cdn.example.com/live.mp4",
      true,
    );
    await user.click(screen.getByRole("button", { name: "expand-New file (not saved)" }));
    expect(props.onOpenLightbox).toHaveBeenCalledWith("blob:pending", false);
    await user.click(screen.getByRole("button", { name: "remove-New file (not saved)" }));
    expect(props.onDiscardSelectedFile).toHaveBeenCalled();
  });
});
