import { describe, expect, it } from "vitest";
import { parseAgregarAdminError } from "./agregarAdminErrors";

describe("parseAgregarAdminError", () => {
  it("returns Nest message when present", () => {
    expect(parseAgregarAdminError({ message: "boom" }, "fallback")).toBe("boom");
  });

  it("returns fallback when message is missing", () => {
    expect(parseAgregarAdminError({}, "fallback")).toBe("fallback");
  });
});
