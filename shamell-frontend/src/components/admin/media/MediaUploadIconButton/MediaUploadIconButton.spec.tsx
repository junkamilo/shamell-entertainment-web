/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MediaUploadIconButton } from "./MediaUploadIconButton";

function fileInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("MediaUploadIconButton", () => {
  it("calls onFilesChange when a file is selected", () => {
    const onFilesChange = vi.fn();
    render(<MediaUploadIconButton onFilesChange={onFilesChange} />);
    const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput(), { target: { files: [file] } });
    expect(onFilesChange).toHaveBeenCalledWith([file]);
  });

  it("supports multiple files", () => {
    const onFilesChange = vi.fn();
    render(<MediaUploadIconButton onFilesChange={onFilesChange} multiple />);
    const files = [
      new File(["a"], "a.jpg", { type: "image/jpeg" }),
      new File(["b"], "b.jpg", { type: "image/jpeg" }),
    ];
    fireEvent.change(fileInput(), { target: { files } });
    expect(onFilesChange).toHaveBeenCalledWith(files);
  });

  it("disables the input when disabled", () => {
    render(<MediaUploadIconButton onFilesChange={vi.fn()} disabled />);
    expect(fileInput()).toBeDisabled();
  });

  it("exposes aria-label on the trigger", () => {
    render(
      <MediaUploadIconButton
        onFilesChange={vi.fn()}
        aria-label="Upload hero media"
      />,
    );
    expect(screen.getByLabelText("Upload hero media")).toBeInTheDocument();
  });
});
