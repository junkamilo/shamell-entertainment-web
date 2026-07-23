import { describe, it, expect } from "vitest";
import { parseAboutAdminError } from "./parseAboutAdminError";

describe("parseAboutAdminError", () => {
  it("returns Nest message when present, otherwise fallback", () => {
    expect(parseAboutAdminError({ message: "  Boom  " }, "Fallback")).toBe("Boom");
    expect(parseAboutAdminError(null, "Fallback")).toBe("Fallback");
    expect(parseAboutAdminError({}, "Fallback")).toBe("Fallback");
  });

  it("joins Nest validation message arrays", () => {
    expect(parseAboutAdminError({ message: ["Title required", "Body required"] }, "Fallback")).toBe(
      "Title required Body required",
    );
  });
});
