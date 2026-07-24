/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockHeaderMediaPageState } from "../test/helpers/mockHeaderMediaPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("../hooks/useHeaderMediaPage", () => ({
  useHeaderMediaPage: () => createMockHeaderMediaPageState(),
}));

vi.mock("./HeaderMediaPageContent", () => ({
  default: () => <div data-testid="header-media-page-content" />,
}));

import HeaderMediaPage from "./HeaderMediaPage";

describe("HeaderMediaPage", () => {
  it("renders HeaderMediaPageContent", () => {
    renderWithProviders(<HeaderMediaPage />);
    expect(screen.getByTestId("header-media-page-content")).toBeInTheDocument();
  });
});
