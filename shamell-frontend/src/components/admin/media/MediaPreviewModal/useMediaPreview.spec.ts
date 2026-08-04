/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useMediaPreview } from "./useMediaPreview";

describe("useMediaPreview", () => {
  it("opens and closes preview state", () => {
    const { result } = renderHook(() => useMediaPreview());
    expect(result.current.isPreviewOpen).toBe(false);

    act(() => {
      result.current.openPreview({
        src: "https://cdn.example/photo.jpg",
        title: "Hero",
      });
    });
    expect(result.current.isPreviewOpen).toBe(true);
    expect(result.current.preview).toEqual({
      src: "https://cdn.example/photo.jpg",
      title: "Hero",
      mediaType: "IMAGE",
    });

    act(() => {
      result.current.closePreview();
    });
    expect(result.current.isPreviewOpen).toBe(false);
    expect(result.current.preview).toBeNull();
  });

  it("does not open when src is empty", () => {
    const { result } = renderHook(() => useMediaPreview());
    act(() => {
      result.current.openPreview({ src: "   " });
    });
    expect(result.current.isPreviewOpen).toBe(false);
  });

  it("infers VIDEO from extension or Cloudinary path", () => {
    const { result } = renderHook(() => useMediaPreview());
    act(() => {
      result.current.openPreview({ src: "https://cdn.example/clip.mp4" });
    });
    expect(result.current.preview?.mediaType).toBe("VIDEO");

    act(() => {
      result.current.openPreview({
        src: "https://res.cloudinary.com/demo/video/upload/v1/sample.mp4",
      });
    });
    expect(result.current.preview?.mediaType).toBe("VIDEO");
  });

  it("respects explicit mediaType over inference", () => {
    const { result } = renderHook(() => useMediaPreview());
    act(() => {
      result.current.openPreview({
        src: "https://cdn.example/clip.mp4",
        mediaType: "IMAGE",
      });
    });
    expect(result.current.preview?.mediaType).toBe("IMAGE");
  });
});
