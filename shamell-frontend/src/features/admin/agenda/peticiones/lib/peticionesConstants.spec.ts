import { describe, expect, it } from "vitest";
import { formatRequestDate } from "./peticionesConstants";

describe("peticionesConstants", () => {
  it("re-exports formatRequestDate", () => {
    expect(typeof formatRequestDate).toBe("function");
  });
});
