/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AGENDA_BOX_OFFICE_PATH } from "../../lib/agendaRoutes";

const replace = vi.fn();
let params = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({
    get: (key: string) => params.get(key),
    toString: () => params.toString(),
  }),
}));

import { useBoxOfficeMode } from "./useBoxOfficeMode";

describe("useBoxOfficeMode", () => {
  beforeEach(() => {
    replace.mockClear();
    params = new URLSearchParams();
  });

  it("defaults to fixed mode when there is no query param", () => {
    const { result } = renderHook(() => useBoxOfficeMode());
    expect(result.current.mode).toBe("fixed");
  });

  it("reads mode=classes from the query", () => {
    params.set("mode", "classes");
    const { result } = renderHook(() => useBoxOfficeMode());
    expect(result.current.mode).toBe("classes");
  });

  it("navigates to mode=classes and preserves other params", () => {
    params.set("foo", "bar");
    const { result } = renderHook(() => useBoxOfficeMode());

    act(() => {
      result.current.setMode("classes");
    });

    expect(replace).toHaveBeenCalledWith(
      `${AGENDA_BOX_OFFICE_PATH}?foo=bar&mode=classes`,
      { scroll: false },
    );
  });

  it("clears the mode param when switching back to fixed", () => {
    params.set("mode", "classes");
    const { result } = renderHook(() => useBoxOfficeMode());

    act(() => {
      result.current.setMode("fixed");
    });

    expect(replace).toHaveBeenCalledWith(AGENDA_BOX_OFFICE_PATH, {
      scroll: false,
    });
  });
});
