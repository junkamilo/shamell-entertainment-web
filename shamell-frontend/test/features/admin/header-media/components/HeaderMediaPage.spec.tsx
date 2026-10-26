/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockHeaderMediaPageState } from "@test/features/admin/header-media/support/helpers/mockHeaderMediaPage";
import { renderWithProviders } from "@test/features/admin/header-media/support/helpers/renderWithProviders";

vi.mock("@/features/admin/header-media/hooks/useHeaderMediaPage", () => ({
  useHeaderMediaPage: () => createMockHeaderMediaPageState(),
}));

vi.mock("@/features/admin/header-media/components/HeaderMediaPageContent", () => ({
  default: () => <div data-testid="header-media-page-content" />,
}));

import HeaderMediaPage from "@/features/admin/header-media/components/HeaderMediaPage";

describe("HeaderMediaPage", () => {
  it("renders HeaderMediaPageContent", () => {
    renderWithProviders(<HeaderMediaPage />);
    expect(screen.getByTestId("header-media-page-content")).toBeInTheDocument();
  });
});
