/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { AGENDAR_PATH } from "../../lib/agendaRoutes";

const replace = vi.fn();
let params = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => ({
    get: (key: string) => params.get(key),
    toString: () => params.toString(),
  }),
}));

import { useBookClassKind } from "./useBookClassKind";

describe("useBookClassKind", () => {
  beforeEach(() => {
    replace.mockClear();
    params = new URLSearchParams();
  });

  it("defaults to private when classKind is missing", () => {
    const { result } = renderHook(() => useBookClassKind());
    expect(result.current.classKind).toBe("private");
  });

  it("reads classKind=group from the query", () => {
    params.set("classKind", "group");
    const { result } = renderHook(() => useBookClassKind());
    expect(result.current.classKind).toBe("group");
  });

  it("sets group and keeps mode=class", () => {
    const { result } = renderHook(() => useBookClassKind());
    act(() => {
      result.current.setClassKind("group");
    });
    expect(replace).toHaveBeenCalledWith(`${AGENDAR_PATH}?mode=class&classKind=group`, {
      scroll: false,
    });
  });

  it("clears classKind when switching to private", () => {
    params.set("mode", "class");
    params.set("classKind", "group");
    const { result } = renderHook(() => useBookClassKind());
    act(() => {
      result.current.setClassKind("private");
    });
    expect(replace).toHaveBeenCalledWith(`${AGENDAR_PATH}?mode=class`, { scroll: false });
  });
});
