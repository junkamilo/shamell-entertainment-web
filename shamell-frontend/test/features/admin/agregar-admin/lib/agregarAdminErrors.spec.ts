import { describe, expect, it } from "vitest";
import { parseAgregarAdminError } from "@/features/admin/agregar-admin/lib/agregarAdminErrors";

describe("parseAgregarAdminError", () => {
  it("returns Nest message when present", () => {
    expect(parseAgregarAdminError({ message: "boom" }, "fallback")).toBe("boom");
  });

  it("returns fallback when message is missing", () => {
    expect(parseAgregarAdminError({}, "fallback")).toBe("fallback");
  });
});
