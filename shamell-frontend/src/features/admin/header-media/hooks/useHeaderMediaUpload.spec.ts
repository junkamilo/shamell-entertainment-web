/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { fileKey } from "../lib/headerMediaUtils";
import { useHeaderMediaUpload } from "./useHeaderMediaUpload";

describe("useHeaderMediaUpload", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "URL",
      Object.assign(URL, {
        createObjectURL: vi.fn(() => "blob:preview"),
        revokeObjectURL: vi.fn(),
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("mergeFiles keeps only image/video and dedupes", () => {
    const { result } = renderHook(() => useHeaderMediaUpload());
    const image = new File(["a"], "a.jpg", { type: "image/jpeg" });
    const video = new File(["b"], "b.mp4", { type: "video/mp4" });
    const text = new File(["c"], "c.txt", { type: "text/plain" });

    act(() => {
      result.current.mergeFiles([image, video, text, image]);
    });

    expect(result.current.pendingFiles).toHaveLength(2);
    expect(result.current.pendingTotalBytes).toBe(image.size + video.size);
    expect(result.current.pendingPreviews[fileKey(image)]).toBe("blob:preview");
  });

  it("removePendingOne and clearPending manage the queue", () => {
    const { result } = renderHook(() => useHeaderMediaUpload());
    const image = new File(["a"], "a.jpg", { type: "image/jpeg" });

    act(() => {
      result.current.mergeFiles([image]);
    });
    act(() => {
      result.current.removePendingOne(fileKey(image));
    });
    expect(result.current.pendingFiles).toHaveLength(0);

    act(() => {
      result.current.mergeFiles([image]);
      result.current.clearPending();
    });
    expect(result.current.pendingFiles).toHaveLength(0);
  });

  it("tracks dragOver via dropzone handlers", () => {
    const { result } = renderHook(() => useHeaderMediaUpload());
    const prevent = vi.fn();
    const stop = vi.fn();

    act(() => {
      result.current.onDropzoneDragOver({
        preventDefault: prevent,
        stopPropagation: stop,
      } as unknown as React.DragEvent<HTMLElement>);
    });
    expect(result.current.dragOver).toBe(true);

    act(() => {
      result.current.onDropzoneDragLeave({
        preventDefault: prevent,
        stopPropagation: stop,
      } as unknown as React.DragEvent<HTMLElement>);
    });
    expect(result.current.dragOver).toBe(false);
  });
});
