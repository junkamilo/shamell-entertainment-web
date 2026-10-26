/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import VenueDancerBench from "@/components/venue-3d/bench/VenueDancerBench/VenueDancerBench";

describe("VenueDancerBench", () => {
  it("smoke mounts without throwing", () => {
    expect(() => render(<VenueDancerBench />)).not.toThrow();
  });

  it("exports named and default from folder index", async () => {
    const mod = await import("@/components/venue-3d/bench/VenueDancerBench/index");
    expect(typeof mod.default).toBe("function");
    expect(mod.VenueDancerBench).toBe(mod.default);
  });
});
