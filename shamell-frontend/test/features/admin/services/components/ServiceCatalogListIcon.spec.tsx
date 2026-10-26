/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@test/features/admin/services/support/helpers/renderWithProviders";
import ServiceCatalogListIcon from "@/features/admin/services/components/ServiceCatalogListIcon";

describe("ServiceCatalogListIcon", () => {
  it("renders with aria-hidden", () => {
    const { container } = renderWithProviders(<ServiceCatalogListIcon />);
    const icon = container.firstElementChild;
    expect(icon).toHaveAttribute("aria-hidden");
  });
});
