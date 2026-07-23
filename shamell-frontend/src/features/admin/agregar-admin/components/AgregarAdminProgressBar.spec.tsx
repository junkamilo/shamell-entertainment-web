/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import AgregarAdminProgressBar from "./AgregarAdminProgressBar";

describe("AgregarAdminProgressBar", () => {
  it("uses w-[38%] in phase 1", () => {
    const { container } = renderWithProviders(
      <AgregarAdminProgressBar phase={1} />,
    );
    const fill = container.querySelector(".h-full");
    expect(fill?.className).toContain("w-[38%]");
  });

  it("uses w-full in phase 2", () => {
    const { container } = renderWithProviders(
      <AgregarAdminProgressBar phase={2} />,
    );
    const fill = container.querySelector(".h-full");
    expect(fill?.className).toContain("w-full");
  });
});
