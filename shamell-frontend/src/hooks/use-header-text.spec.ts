/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { DEFAULT_HEADER_TEXT } from "@/lib/header-media/headerTextTypes";
import { server } from "@/test/server";
import { makeHeaderTextContent } from "./test/fixtures/hooks.fixture";
import { FIXTURE_HEADER_HEADLINE } from "./test/fixtures/uuids.fixture";
import { useHeaderText } from "./use-header-text";

describe("useHeaderText", () => {
  it("loads header text from the public API", async () => {
    const { result } = renderHook(() => useHeaderText());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.content.headline).toBe(FIXTURE_HEADER_HEADLINE);
  });

  it("skips fetch when initialContent is provided", async () => {
    const initial = makeHeaderTextContent({ headline: "SSR Header" });
    const { result } = renderHook(() => useHeaderText(initial));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.content.headline).toBe("SSR Header");
  });

  it("falls back to defaults when the API fails", async () => {
    server.use(
      http.get("*/api/v1/header-text", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useHeaderText());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.content.headline).toBe(DEFAULT_HEADER_TEXT.headline);
  });
});
