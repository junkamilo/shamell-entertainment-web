/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import ServiceCatalogListIcon from "./ServiceCatalogListIcon";

describe("ServiceCatalogListIcon", () => {
  it("renders with aria-hidden", () => {
    const { container } = renderWithProviders(<ServiceCatalogListIcon />);
    const icon = container.firstElementChild;
    expect(icon).toHaveAttribute("aria-hidden");
  });
});
