/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import CatalogOfferingDetailModal from "./CatalogOfferingDetailModal";

describe("CatalogOfferingDetailModal", () => {
  it("renders offering details when open", async () => {
    renderWithProviders(
      <CatalogOfferingDetailModal
        isOpen
        onClose={vi.fn()}
        title="Gala Night"
        description="An elegant evening."
        items={["Host", "Sound check"]}
        price={2500}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(screen.getByText("Gala Night")).toBeInTheDocument();
    expect(screen.getByText("An elegant evening.")).toBeInTheDocument();
    expect(screen.getByText("Host")).toBeInTheDocument();
  });

  it("calls onClose from Close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <CatalogOfferingDetailModal
        isOpen
        onClose={onClose}
        title="Gala Night"
        description=""
        items={[]}
        price={null}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    renderWithProviders(
      <CatalogOfferingDetailModal
        isOpen={false}
        onClose={vi.fn()}
        title="Gala Night"
        description=""
        items={[]}
        price={null}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
