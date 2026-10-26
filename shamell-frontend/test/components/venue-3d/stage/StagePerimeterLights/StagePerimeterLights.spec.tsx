/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import StagePerimeterLights from "@/components/venue-3d/stage/StagePerimeterLights/StagePerimeterLights";

describe("StagePerimeterLights", () => {
  it("mounts instanced marquee bulbs", () => {
    const { container } = render(<StagePerimeterLights />);
    expect(container.querySelectorAll('[data-r3f="instancedMesh"]').length).toBe(2);
  });
});
