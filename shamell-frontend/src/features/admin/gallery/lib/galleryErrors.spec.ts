import { describe, expect, it } from "vitest";
import { parseGalleryError } from "./galleryErrors";

describe("parseGalleryError", () => {
  it("returns Nest message when present", () => {
    expect(parseGalleryError({ message: "boom" }, "fallback")).toBe("boom");
  });

  it("returns fallback when message is missing", () => {
    expect(parseGalleryError({}, "fallback")).toBe("fallback");
  });

  it("joins Nest validation message arrays", () => {
    expect(parseGalleryError({ message: ["A", "B"] }, "fallback")).toBe("A B");
  });
});
