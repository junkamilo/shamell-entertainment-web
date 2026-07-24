/** @vitest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useState } from "react";
import { makeHeaderPhoto } from "../test/fixtures/headerMedia.fixture";
import { FIXTURE_HEADER_PHOTO_ID } from "../test/fixtures/uuids.fixture";
import type { HeaderPhoto } from "../types/headerMedia.types";

const toastMock = vi.fn();
const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("../lib/headerMediaAuth", () => ({
  getHeaderMediaBearerToken: () => getTokenMock(),
}));

import { useHeaderMediaFocus } from "./useHeaderMediaFocus";

function useFocusHarness(initial: HeaderPhoto[] = [makeHeaderPhoto()]) {
  const [photos, setPhotos] = useState(initial);
  const focus = useHeaderMediaFocus({ setPhotos });
  return { photos, focus };
}

describe("useHeaderMediaFocus", () => {
  beforeEach(() => {
    toastMock.mockClear();
    getTokenMock.mockReturnValue("token-1");
  });

  it("openFocusEditor seeds draft from photo focals", () => {
    const { result } = renderHook(() => useFocusHarness());
    const photo = makeHeaderPhoto({
      focalX: 20,
      focalY: 30,
      focalMobileX: 40,
      focalMobileY: 50,
    });

    act(() => {
      result.current.focus.openFocusEditor(photo);
    });

    expect(result.current.focus.editingFocusPhoto?.id).toBe(photo.id);
    expect(result.current.focus.focusDraft).toEqual({
      desktopX: 20,
      desktopY: 30,
      mobileX: 40,
      mobileY: 50,
    });
  });

  it("setDraftFromPoint updates desktop coordinates", () => {
    const { result } = renderHook(() => useFocusHarness());
    act(() => {
      result.current.focus.openFocusEditor(makeHeaderPhoto());
    });

    act(() => {
      result.current.focus.setDraftFromPoint(
        {
          currentTarget: {
            getBoundingClientRect: () => ({
              left: 0,
              top: 0,
              width: 100,
              height: 100,
            }),
          },
          clientX: 25,
          clientY: 75,
        } as unknown as React.MouseEvent<HTMLDivElement>,
        "desktop",
      );
    });

    expect(result.current.focus.focusDraft.desktopX).toBe(25);
    expect(result.current.focus.focusDraft.desktopY).toBe(75);
  });

  it("saveFocusEditor patches focals and clears editor", async () => {
    const { result } = renderHook(() => useFocusHarness());
    act(() => {
      result.current.focus.openFocusEditor(makeHeaderPhoto());
      result.current.focus.setFocusDraft({
        desktopX: 10,
        desktopY: 20,
        mobileX: 30,
        mobileY: 40,
      });
    });

    await act(async () => {
      await result.current.focus.saveFocusEditor();
    });

    await waitFor(() => {
      expect(result.current.focus.editingFocusPhoto).toBeNull();
    });
    expect(result.current.photos[0]).toMatchObject({
      id: FIXTURE_HEADER_PHOTO_ID,
      focalX: 10,
      focalY: 20,
      focalMobileX: 30,
      focalMobileY: 40,
    });
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Focus updated" }),
    );
  });

  it("clearFocusIfDeleted clears matching editor photo", () => {
    const { result } = renderHook(() => useFocusHarness());
    act(() => {
      result.current.focus.openFocusEditor(makeHeaderPhoto());
      result.current.focus.clearFocusIfDeleted(FIXTURE_HEADER_PHOTO_ID);
    });
    expect(result.current.focus.editingFocusPhoto).toBeNull();
  });
});
