/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@test/features/admin/header-media/support/helpers/renderWithProviders";
import SectionGoldDivider from "@/features/admin/header-media/components/SectionGoldDivider";

describe("SectionGoldDivider", () => {
  it("renders a decorative divider", () => {
    const { container } = renderWithProviders(<SectionGoldDivider />);
    expect(container.querySelector("[aria-hidden]")).toBeTruthy();
  });
});
