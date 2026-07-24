/** @vitest-environment jsdom */

import type React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeVenueTable } from "../test/fixtures/venueTables.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

const mockConfigurator = {
  isEditMode: false,
  quantity: 1,
  setQuantity: vi.fn(),
  incrementQuantity: vi.fn(),
  decrementQuantity: vi.fn(),
  canIncrementQuantity: true,
  canDecrementQuantity: false,
  size: "LARGE" as const,
  setSize: vi.fn(),
  includedChairs: 6,
  incrementChairs: vi.fn(),
  decrementChairs: vi.fn(),
  canIncrement: true,
  canDecrement: true,
  bundlePriceInput: "250",
  setBundlePriceInput: vi.fn(),
  fieldErrors: [] as string[],
  saving: false,
  save: vi.fn(),
};

vi.mock("../hooks/useTableConfigurator", () => ({
  useTableConfigurator: () => mockConfigurator,
}));

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

vi.mock("./TableChairRing", () => ({
  default: () => <div data-testid="table-chair-ring" />,
}));

vi.mock("./TableSizeSelector", () => ({
  default: () => <div data-testid="table-size-selector" />,
}));

vi.mock("./TablePricingFields", () => ({
  default: () => <div data-testid="table-pricing-fields" />,
}));

vi.mock("./TableConfigSummary", () => ({
  default: () => <div data-testid="table-config-summary" />,
}));

import TableConfiguratorModal from "./TableConfiguratorModal";

function renderModal(
  overrides: Partial<React.ComponentProps<typeof TableConfiguratorModal>> = {},
) {
  const props: React.ComponentProps<typeof TableConfiguratorModal> = {
    open: true,
    editing: null,
    onClose: vi.fn(),
    onSaved: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<TableConfiguratorModal {...props} />), props };
}

describe("TableConfiguratorModal", () => {
  beforeEach(() => {
    mockConfigurator.isEditMode = false;
    mockConfigurator.saving = false;
    mockConfigurator.fieldErrors = [];
    mockConfigurator.quantity = 1;
    vi.clearAllMocks();
  });

  it("renders create mode title and child sections when open", () => {
    renderModal();
    expect(
      screen.getByRole("dialog", { name: /Configure new tables/i }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("table-size-selector")).toBeInTheDocument();
    expect(screen.getByTestId("table-chair-ring")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create table" })).toBeInTheDocument();
  });

  it("renders edit mode title when editing", () => {
    mockConfigurator.isEditMode = true;
    renderModal({ editing: makeVenueTable() });
    expect(
      screen.getByRole("heading", { name: "Edit table configuration" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save configuration" }),
    ).toBeInTheDocument();
  });

  it("calls onClose from Cancel", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("calls save from primary action", async () => {
    const user = userEvent.setup();
    renderModal();
    await user.click(screen.getByRole("button", { name: "Create table" }));
    expect(mockConfigurator.save).toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    renderModal({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
