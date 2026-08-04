/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { server } from "@/test/server";
import { fallbackAboutContent } from "@/lib/about/aboutContent";
import { makeAboutContent } from "./test/fixtures/hooks.fixture";
import { FIXTURE_ABOUT_TITLE } from "./test/fixtures/uuids.fixture";
import { useAboutContent } from "./use-about-content";

vi.mock("@/lib/hero/aboutMediaPreload", () => ({
  preloadAboutHeroMedia: () => () => undefined,
}));

describe("useAboutContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads about content from the public API", async () => {
    const { result } = renderHook(() => useAboutContent());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.about.title).toBe(FIXTURE_ABOUT_TITLE);
  });

  it("skips fetch when initialAbout is provided", async () => {
    const initial = makeAboutContent({ title: "SSR About" });
    const { result } = renderHook(() => useAboutContent(initial));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.about.title).toBe("SSR About");
  });

  it("falls back when the API fails", async () => {
    server.use(
      http.get("*/api/v1/about", () =>
        HttpResponse.json({ message: "down" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useAboutContent());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.about.title).toBe(fallbackAboutContent.title);
  });
});
