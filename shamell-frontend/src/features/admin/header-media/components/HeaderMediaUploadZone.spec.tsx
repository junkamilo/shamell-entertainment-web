/** @vitest-environment jsdom */

import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/media", () => ({
  MediaUploadIconButton: () => (
    <button type="button" aria-label="Upload images or videos" />
  ),
}));

import HeaderMediaUploadZone from "./HeaderMediaUploadZone";

describe("HeaderMediaUploadZone", () => {
  it("renders upload label and button", () => {
    renderWithProviders(
      <HeaderMediaUploadZone
        fileInputRef={createRef()}
        onFilesChange={vi.fn()}
      />,
    );
    expect(screen.getByText("01 — UPLOAD MEDIA")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload images or videos" }),
    ).toBeInTheDocument();
  });
});
