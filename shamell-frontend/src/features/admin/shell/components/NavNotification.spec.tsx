/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { NavNotification } from "./NavNotification";

describe("NavNotification", () => {
  it("renders nothing when count is 0", () => {
    const { container } = renderWithProviders(<NavNotification count={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows count and aria-label when expanded", () => {
    renderWithProviders(<NavNotification count={3} />);
    expect(
      screen.getByLabelText("3 new notifications"),
    ).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("caps display at 99+", () => {
    renderWithProviders(<NavNotification count={120} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("renders a dot when collapsed", () => {
    const { container } = renderWithProviders(
      <NavNotification count={2} collapsed />,
    );
    expect(container.querySelector("span")).toBeTruthy();
    expect(screen.queryByLabelText(/new notifications/)).toBeNull();
  });
});
