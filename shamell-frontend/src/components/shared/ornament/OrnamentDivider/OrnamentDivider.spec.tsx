/** @vitest-environment jsdom */

import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import OrnamentDivider from "./OrnamentDivider";

describe("OrnamentDivider", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders decorative star svgs", () => {
    const { container } = render(<OrnamentDivider />);
    expect(container.querySelectorAll("svg")).toHaveLength(2);
  });

  it("appends a custom className", () => {
    const { container } = render(<OrnamentDivider className="mt-4" />);
    expect(container.firstElementChild?.className).toContain("mt-4");
  });
});
