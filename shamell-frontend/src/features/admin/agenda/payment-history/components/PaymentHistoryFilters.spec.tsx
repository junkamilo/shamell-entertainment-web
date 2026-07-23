/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/inputs", () => ({
  AccordionSingleSelect: ({
    ariaLabel,
    value,
    onChange,
    options,
  }: {
    ariaLabel: string;
    value: string;
    onChange: (id: string) => void;
    options: Array<{ id: string; label: string }>;
  }) => (
    <label>
      {ariaLabel}
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.id || "all"} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

import PaymentHistoryFilters from "./PaymentHistoryFilters";

describe("PaymentHistoryFilters", () => {
  const baseProps = {
    flowFilter: "" as const,
    statusFilter: "" as const,
    search: "",
    onFlowChange: vi.fn(),
    onStatusChange: vi.fn(),
    onSearchChange: vi.fn(),
    onApplySearch: vi.fn(),
    onRefresh: vi.fn(),
  };

  it("renders flow/status filters and search", () => {
    renderWithProviders(<PaymentHistoryFilters {...baseProps} />);
    expect(
      screen.getByRole("combobox", { name: /Filter by payment flow/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /Filter by payment status/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search by name or email"),
    ).toBeInTheDocument();
  });

  it("wires filter and refresh callbacks", async () => {
    const user = userEvent.setup();
    const onFlowChange = vi.fn();
    const onStatusChange = vi.fn();
    const onRefresh = vi.fn();
    renderWithProviders(
      <PaymentHistoryFilters
        {...baseProps}
        onFlowChange={onFlowChange}
        onStatusChange={onStatusChange}
        onRefresh={onRefresh}
      />,
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /Filter by payment flow/i }),
      "BOOKING_QUOTE",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /Filter by payment status/i }),
      "PAID",
    );
    await user.click(screen.getByRole("button", { name: "Refresh" }));
    expect(onFlowChange).toHaveBeenCalledWith("BOOKING_QUOTE");
    expect(onStatusChange).toHaveBeenCalledWith("PAID");
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("applies search on submit", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onApplySearch = vi.fn();
    renderWithProviders(
      <PaymentHistoryFilters
        {...baseProps}
        onSearchChange={onSearchChange}
        onApplySearch={onApplySearch}
      />,
    );
    await user.type(
      screen.getByPlaceholderText("Search by name or email"),
      "ada",
    );
    expect(onSearchChange).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(onApplySearch).toHaveBeenCalledOnce();
  });
});
