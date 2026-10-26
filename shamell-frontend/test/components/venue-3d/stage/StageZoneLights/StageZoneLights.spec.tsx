/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import StageZoneLights from "@/components/venue-3d/stage/StageZoneLights/StageZoneLights";

describe("StageZoneLights", () => {
  it("mounts the spot and stair point lights", () => {
    const { container } = render(<StageZoneLights />);
    expect(container.querySelector('[data-r3f="spotLight"]')).toBeTruthy();
    expect(container.querySelector('[data-r3f="pointLight"]')).toBeTruthy();
  });
});
