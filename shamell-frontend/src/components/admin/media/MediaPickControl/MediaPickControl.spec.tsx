/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MediaPickControl } from "./MediaPickControl";

function fileInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("MediaPickControl", () => {
  it("shows empty selection label by default", () => {
    render(<MediaPickControl />);
    expect(screen.getByText("No file chosen")).toBeInTheDocument();
  });

  it("shows selected file name in single mode", () => {
    render(<MediaPickControl selectedFileName="hero.png" />);
    expect(screen.getByText("hero.png")).toBeInTheDocument();
  });

  it("calls onFileChange in single mode", () => {
    const onFileChange = vi.fn();
    render(<MediaPickControl onFileChange={onFileChange} />);
    const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });
    fireEvent.change(fileInput(), { target: { files: [file] } });
    expect(onFileChange).toHaveBeenCalledWith(file);
  });

  it("shows selected count and calls onFilesChange in multi mode", () => {
    const onFilesChange = vi.fn();
    render(
      <MediaPickControl multiple selectedFileCount={2} onFilesChange={onFilesChange} />,
    );
    expect(screen.getByText("2 file(s) selected")).toBeInTheDocument();
    const files = [
      new File(["a"], "a.jpg", { type: "image/jpeg" }),
      new File(["b"], "b.jpg", { type: "image/jpeg" }),
    ];
    fireEvent.change(fileInput(), { target: { files } });
    expect(onFilesChange).toHaveBeenCalledWith(files);
  });
});
