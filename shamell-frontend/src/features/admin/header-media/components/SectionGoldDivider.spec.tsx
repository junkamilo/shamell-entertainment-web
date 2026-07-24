/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import SectionGoldDivider from "./SectionGoldDivider";

describe("SectionGoldDivider", () => {
  it("renders a decorative divider", () => {
    const { container } = renderWithProviders(<SectionGoldDivider />);
    expect(container.querySelector("[aria-hidden]")).toBeTruthy();
  });
});
