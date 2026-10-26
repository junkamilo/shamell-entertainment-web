/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/admin/agenda/box-office/support/helpers/renderWithProviders";

vi.mock("@/features/admin/agenda/box-office/components/BoxOfficePageContent", () => ({
  default: () => <div data-testid="box-office-page-content" />,
}));

import BoxOfficePage from "@/features/admin/agenda/box-office/components/BoxOfficePage";

describe("BoxOfficePage", () => {
  it("renders BoxOfficePageContent", () => {
    renderWithProviders(<BoxOfficePage />);
    expect(screen.getByTestId("box-office-page-content")).toBeInTheDocument();
  });
});
