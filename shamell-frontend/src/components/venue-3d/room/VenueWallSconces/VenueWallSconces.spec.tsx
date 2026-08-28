/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import VenueWallSconces from "./VenueWallSconces";

describe("VenueWallSconces", () => {
  it("places wall lights on the high profile", () => {
    const { container } = render(<VenueWallSconces />);
    expect(container.querySelectorAll('[data-r3f="pointLight"]').length).toBeGreaterThan(0);
  });

  it("omits point lights on mobile", () => {
    const { container } = render(<VenueWallSconces perfProfile="mobile" />);
    expect(container.querySelectorAll('[data-r3f="pointLight"]').length).toBe(0);
    expect(container.querySelectorAll('[data-r3f="group"]').length).toBeGreaterThan(1);
  });
});
