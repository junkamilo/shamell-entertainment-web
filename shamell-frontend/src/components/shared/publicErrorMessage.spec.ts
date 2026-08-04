import { describe, expect, it } from "vitest";
import { PUBLIC_ERROR_FALLBACK, publicErrorMessage } from "./publicErrorMessage";

describe("publicErrorMessage", () => {
  it("returns generic message in production", () => {
    expect(
      publicErrorMessage(new Error("secret db detail"), { isDev: false }),
    ).toBe(PUBLIC_ERROR_FALLBACK);
  });

  it("returns trimmed error message in development", () => {
    expect(
      publicErrorMessage(new Error("  boom  "), { isDev: true }),
    ).toBe("boom");
  });

  it("falls back when development message is empty", () => {
    expect(publicErrorMessage(new Error("   "), { isDev: true })).toBe(
      PUBLIC_ERROR_FALLBACK,
    );
  });
});
