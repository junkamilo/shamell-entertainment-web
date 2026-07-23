import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  buildAboutStats,
  excerptBody,
  formatRelativeEn,
  normalizeAdminAboutRow,
  parseCoreValuesFromText,
} from "./aboutAdminUtils";
import { makeAdminAboutRow } from "../test/fixtures/about.fixture";

describe("excerptBody", () => {
  it("uses the first non-empty line and collapses whitespace", () => {
    expect(excerptBody("\n  Hello   world  \nSecond")).toBe("Hello world");
  });

  it("returns empty string when there is no content", () => {
    expect(excerptBody("")).toBe("");
    expect(excerptBody("\n\n  \n")).toBe("");
  });

  it("truncates with ellipsis when over max", () => {
    expect(excerptBody("abcdefghij", 5)).toBe("abcde…");
  });
});

describe("formatRelativeEn", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns em dash for missing or invalid dates", () => {
    expect(formatRelativeEn(undefined)).toBe("—");
    expect(formatRelativeEn("not-a-date")).toBe("—");
  });

  it("formats recent buckets", () => {
    expect(formatRelativeEn("2026-06-15T11:59:30.000Z")).toBe("Just now");
    expect(formatRelativeEn("2026-06-15T11:50:00.000Z")).toBe("10 min ago");
    expect(formatRelativeEn("2026-06-15T09:00:00.000Z")).toBe("3h ago");
    expect(formatRelativeEn("2026-06-13T12:00:00.000Z")).toBe("2d ago");
  });

  it("formats older dates as locale date", () => {
    const iso = "2026-01-01T12:00:00.000Z";
    expect(formatRelativeEn(iso)).toBe(
      new Date(iso).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    );
  });
});

describe("parseCoreValuesFromText", () => {
  it("splits lines, trims, and drops empties", () => {
    expect(parseCoreValuesFromText("  A \n\nB\n  \n C ")).toEqual(["A", "B", "C"]);
  });
});

describe("normalizeAdminAboutRow", () => {
  it("returns null for invalid payloads", () => {
    expect(normalizeAdminAboutRow(null)).toBeNull();
    expect(normalizeAdminAboutRow({})).toBeNull();
    expect(normalizeAdminAboutRow({ id: "x", title: 1 })).toBeNull();
  });

  it("normalizes heroMediaType to IMAGE unless VIDEO", () => {
    const image = normalizeAdminAboutRow(makeAdminAboutRow({ heroMediaType: "IMAGE" }));
    expect(image?.heroMediaType).toBe("IMAGE");

    const video = normalizeAdminAboutRow(makeAdminAboutRow({ heroMediaType: "VIDEO" }));
    expect(video?.heroMediaType).toBe("VIDEO");

    const coerced = normalizeAdminAboutRow({
      ...makeAdminAboutRow(),
      heroMediaType: "OTHER" as never,
    });
    expect(coerced?.heroMediaType).toBe("IMAGE");
  });
});

describe("buildAboutStats", () => {
  it("returns empty stats when unpublished", () => {
    expect(buildAboutStats(null)).toEqual({
      state: "Not published",
      values: "—",
      media: "—",
      updated: "—",
    });
  });

  it("summarizes a published photo row", () => {
    const stats = buildAboutStats(
      makeAdminAboutRow({
        coreValues: ["A", "B", "C"],
        imageUrl: "https://cdn.test/photo.jpg",
        heroMediaType: "IMAGE",
        updatedAt: undefined,
      }),
    );
    expect(stats.state).toBe("Published");
    expect(stats.values).toBe("3");
    expect(stats.media).toBe("Photo");
    expect(stats.updated).toBe("—");
  });

  it("labels video media from heroMediaType", () => {
    const stats = buildAboutStats(
      makeAdminAboutRow({
        imageUrl: "https://cdn.test/clip.mp4",
        heroMediaType: "VIDEO",
      }),
    );
    expect(stats.media).toBe("Video");
  });

  it("labels No when there is no imageUrl", () => {
    expect(buildAboutStats(makeAdminAboutRow({ imageUrl: null })).media).toBe("No");
  });
});
