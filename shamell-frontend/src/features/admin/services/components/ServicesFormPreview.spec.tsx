/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FIXTURE_SERVICE_ID } from "../test/fixtures/uuids.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import ServicesFormPreview from "./ServicesFormPreview";

function renderPreview(
  overrides: Partial<React.ComponentProps<typeof ServicesFormPreview>> = {},
) {
  const props: React.ComponentProps<typeof ServicesFormPreview> = {
    imagePreviewUrl: null,
    existingImageUrl: null,
    formPreviewMediaIsVideo: false,
    editingId: null,
    hasSelectedFile: false,
    isSubmitting: false,
    isClearingMedia: false,
    onRemoveSelectedFile: vi.fn(),
    onRequestClearSavedMedia: vi.fn(),
    onOpenLightbox: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<ServicesFormPreview {...props} />), props };
}

describe("ServicesFormPreview", () => {
  it("renders null without urls", () => {
    const { container } = renderPreview();
    expect(container).toBeEmptyDOMElement();
  });

  it("calls onRemoveSelectedFile for a selected file", async () => {
    const user = userEvent.setup();
    const { props } = renderPreview({
      imagePreviewUrl: "blob:preview",
      hasSelectedFile: true,
    });

    await user.click(
      screen.getByRole("button", { name: "Remove selected file" }),
    );
    expect(props.onRemoveSelectedFile).toHaveBeenCalledOnce();
  });

  it("calls onRequestClearSavedMedia when editing saved media", async () => {
    const user = userEvent.setup();
    const { props } = renderPreview({
      existingImageUrl: "https://cdn.example.com/service.jpg",
      editingId: FIXTURE_SERVICE_ID,
      hasSelectedFile: false,
    });

    await user.click(
      screen.getByRole("button", {
        name: "Delete saved media from storage",
      }),
    );
    expect(props.onRequestClearSavedMedia).toHaveBeenCalledOnce();
  });
});
