/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { BoxOfficeModeTabs } from "./BoxOfficeModeTabs";

describe("BoxOfficeModeTabs", () => {
  it("renders both tabs by test id", () => {
    renderWithProviders(
      <BoxOfficeModeTabs activeMode="fixed" onModeChange={vi.fn()} />,
    );
    expect(screen.getByTestId("box-office-tab-fixed")).toBeInTheDocument();
    expect(screen.getByTestId("box-office-tab-classes")).toBeInTheDocument();
  });

  it("calls onModeChange with 'classes' when that tab is clicked", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    renderWithProviders(
      <BoxOfficeModeTabs activeMode="fixed" onModeChange={onModeChange} />,
    );

    await user.click(screen.getByTestId("box-office-tab-classes"));
    expect(onModeChange).toHaveBeenCalledWith("classes");
  });

  it("calls onModeChange with 'fixed' when that tab is clicked", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    renderWithProviders(
      <BoxOfficeModeTabs activeMode="classes" onModeChange={onModeChange} />,
    );

    await user.click(screen.getByTestId("box-office-tab-fixed"));
    expect(onModeChange).toHaveBeenCalledWith("fixed");
  });
});
