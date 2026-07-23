/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

const useBoxOfficeModeMock = vi.fn();

vi.mock("../hooks/useBoxOfficeMode", () => ({
  useBoxOfficeMode: () => useBoxOfficeModeMock(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("./BoxOfficeFixedEventPanel", () => ({
  BoxOfficeFixedEventPanel: () => (
    <div data-testid="box-office-fixed-panel" />
  ),
}));

vi.mock("./BoxOfficeClassesPanel", () => ({
  BoxOfficeClassesPanel: () => (
    <div data-testid="box-office-classes-panel" />
  ),
}));

import BoxOfficePageContent from "./BoxOfficePageContent";

describe("BoxOfficePageContent", () => {
  beforeEach(() => {
    useBoxOfficeModeMock.mockReset();
  });

  it("renders the hero and mode tabs, and the fixed panel by default", () => {
    useBoxOfficeModeMock.mockReturnValue({ mode: "fixed", setMode: vi.fn() });
    renderWithProviders(<BoxOfficePageContent />);

    expect(screen.getByText("Box office")).toBeInTheDocument();
    expect(screen.getByTestId("box-office-tab-fixed")).toBeInTheDocument();
    expect(screen.getByTestId("box-office-tab-classes")).toBeInTheDocument();
    expect(screen.getByTestId("box-office-fixed-panel")).toBeInTheDocument();
    expect(
      screen.queryByTestId("box-office-classes-panel"),
    ).not.toBeInTheDocument();
  });

  it("renders the classes panel when mode is classes", () => {
    useBoxOfficeModeMock.mockReturnValue({
      mode: "classes",
      setMode: vi.fn(),
    });
    renderWithProviders(<BoxOfficePageContent />);

    expect(screen.getByTestId("box-office-classes-panel")).toBeInTheDocument();
    expect(
      screen.queryByTestId("box-office-fixed-panel"),
    ).not.toBeInTheDocument();
  });

  it("calls setMode when a tab is clicked", async () => {
    const setMode = vi.fn();
    useBoxOfficeModeMock.mockReturnValue({ mode: "fixed", setMode });
    const user = userEvent.setup();
    renderWithProviders(<BoxOfficePageContent />);

    await user.click(screen.getByTestId("box-office-tab-classes"));
    expect(setMode).toHaveBeenCalledWith("classes");
  });
});
