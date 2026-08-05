/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useHasMounted } from "./use-has-mounted";

describe("useHasMounted", () => {
  it("becomes true after mount", async () => {
    const { result } = renderHook(() => useHasMounted());
    await waitFor(() => expect(result.current).toBe(true));
  });
});
