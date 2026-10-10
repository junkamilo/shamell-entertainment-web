import { describe, expect, it } from "vitest";
import { formatRequestDate } from "@/features/admin/agenda/peticiones/lib/peticionesConstants";

describe("peticionesConstants", () => {
  it("re-exports formatRequestDate", () => {
    expect(typeof formatRequestDate).toBe("function");
  });
});
