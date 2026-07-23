/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { AgendaCatalogSpinner } from "./AgendaCatalogSpinner";

describe("AgendaCatalogSpinner", () => {
  it("renders a spinning loader", () => {
    const { container } = renderWithProviders(<AgendaCatalogSpinner />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });
});
