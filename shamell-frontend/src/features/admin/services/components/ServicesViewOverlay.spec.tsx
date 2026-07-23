/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeAdminService } from "../test/fixtures/services.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import ServicesViewOverlay from "./ServicesViewOverlay";

describe("ServicesViewOverlay", () => {
  it("renders null without service", () => {
    const { container } = renderWithProviders(
      <ServicesViewOverlay service={null} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows QUICK LOOK and closes", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const service = makeAdminService();

    renderWithProviders(
      <ServicesViewOverlay service={service} onClose={onClose} />,
    );

    expect(screen.getByText("QUICK LOOK")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
