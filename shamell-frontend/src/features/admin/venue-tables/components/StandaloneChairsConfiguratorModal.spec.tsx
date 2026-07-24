/** @vitest-environment jsdom */

import type React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      ...props
    }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

const useStandaloneChairConfiguratorMock = vi.fn();

vi.mock("../hooks/useStandaloneChairConfigurator", () => ({
  useStandaloneChairConfigurator: (...args: unknown[]) =>
    useStandaloneChairConfiguratorMock(...args),
}));

import StandaloneChairsConfiguratorModal from "./StandaloneChairsConfiguratorModal";

function buildConfiguratorState(overrides: Record<string, unknown> = {}) {
  return {
    quantity: 2,
    setQuantity: vi.fn(),
    incrementQuantity: vi.fn(),
    decrementQuantity: vi.fn(),
    canIncrementQuantity: true,
    canDecrementQuantity: true,
    maxAddQuantity: 10,
    unitPriceInput: "35",
    setUnitPriceInput: vi.fn(),
    saving: false,
    fieldErrors: [] as string[],
    save: vi.fn(),
    resetForm: vi.fn(),
    ...overrides,
  };
}

describe("StandaloneChairsConfiguratorModal", () => {
  beforeEach(() => {
    useStandaloneChairConfiguratorMock.mockReset();
    useStandaloneChairConfiguratorMock.mockReturnValue(buildConfiguratorState());
  });

  it("does not render when closed", () => {
    renderWithProviders(
      <StandaloneChairsConfiguratorModal
        open={false}
        currentCount={0}
        defaultUnitPrice={35}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders configurator title and add chairs action when open", () => {
    renderWithProviders(
      <StandaloneChairsConfiguratorModal
        open
        currentCount={5}
        defaultUnitPrice={35}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("dialog", { name: "Configure standalone chairs" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Quantity to add")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add 2 chairs" })).toBeInTheDocument();
  });

  it("shows capacity message when maxAddQuantity is zero", () => {
    useStandaloneChairConfiguratorMock.mockReturnValue(
      buildConfiguratorState({ maxAddQuantity: 0 }),
    );

    renderWithProviders(
      <StandaloneChairsConfiguratorModal
        open
        currentCount={500}
        defaultUnitPrice={35}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByText(/Inventory is at capacity/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add 2 chairs" })).toBeDisabled();
  });

  it("calls onClose from Cancel and backdrop", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <StandaloneChairsConfiguratorModal
        open
        currentCount={0}
        defaultUnitPrice={35}
        onClose={onClose}
        onSaved={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("calls save from primary action", async () => {
    const user = userEvent.setup();
    const save = vi.fn();
    useStandaloneChairConfiguratorMock.mockReturnValue(
      buildConfiguratorState({ save }),
    );

    renderWithProviders(
      <StandaloneChairsConfiguratorModal
        open
        currentCount={0}
        defaultUnitPrice={35}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add 2 chairs" }));
    expect(save).toHaveBeenCalled();
  });
});
