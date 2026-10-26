/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@test/features/admin/agenda/shared/support/helpers/renderWithProviders";
import { AgendaCatalogSpinner } from "@/features/admin/agenda/shared/components/AgendaCatalogSpinner";

describe("AgendaCatalogSpinner", () => {
  it("renders a spinning loader", () => {
    const { container } = renderWithProviders(<AgendaCatalogSpinner />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });
});
