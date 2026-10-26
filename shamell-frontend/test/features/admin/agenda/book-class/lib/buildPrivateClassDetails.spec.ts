import { describe, expect, it } from "vitest";
import { buildPrivateClassDetailsSnapshot } from "@/features/admin/agenda/book-class/lib/buildPrivateClassDetails";

describe("buildPrivateClassDetails", () => {
  it("re-exports buildPrivateClassDetailsSnapshot", () => {
    expect(typeof buildPrivateClassDetailsSnapshot).toBe("function");
  });
});
