import { describe, expect, it } from "vitest";
import { buildPrivateClassDetailsSnapshot } from "./buildPrivateClassDetails";

describe("buildPrivateClassDetails", () => {
  it("re-exports buildPrivateClassDetailsSnapshot", () => {
    expect(typeof buildPrivateClassDetailsSnapshot).toBe("function");
  });
});
