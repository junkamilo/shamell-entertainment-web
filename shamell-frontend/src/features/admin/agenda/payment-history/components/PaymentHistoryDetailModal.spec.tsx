/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makePaymentRow } from "../test/fixtures/paymentHistory.fixture";
import { renderWithProviders } from "../test/utils/renderWithProviders";

const detailState = {
  detail: null as null | { customerPhone: string },
  isLoadingDetail: false,
  detailError: null as string | null,
};

vi.mock("@/components/admin/overlays", () => ({
  Modal: ({
    isOpen,
    title,
    children,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

vi.mock("@/features/admin/inquiries", () => ({
  InquiryDetailsReadable: ({
    sectionTitle,
    rows,
  }: {
    sectionTitle: string;
    rows: Array<{ label: string; value: string }>;
  }) => (
    <section>
      <h3>{sectionTitle}</h3>
      <ul>
        {rows.map((r) => (
          <li key={`${sectionTitle}-${r.label}`}>
            {r.label}: {r.value}
          </li>
        ))}
      </ul>
    </section>
  ),
}));

vi.mock("../hooks/usePaymentHistoryDetail", () => ({
  usePaymentHistoryDetail: () => detailState,
}));

import PaymentHistoryDetailModal from "./PaymentHistoryDetailModal";

describe("PaymentHistoryDetailModal", () => {
  beforeEach(() => {
    detailState.detail = null;
    detailState.isLoadingDetail = false;
    detailState.detailError = null;
  });

  it("renders nothing when closed", () => {
    renderWithProviders(
      <PaymentHistoryDetailModal row={null} isOpen={false} onClose={vi.fn()} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows summary sections for a selected payment", () => {
    renderWithProviders(
      <PaymentHistoryDetailModal
        row={makePaymentRow()}
        isOpen
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByRole("dialog", { name: "Payment summary" })).toBeInTheDocument();
    expect(screen.getByText("CUSTOMER")).toBeInTheDocument();
    expect(screen.getByText("PURCHASE")).toBeInTheDocument();
    expect(screen.getByText("PAYMENT")).toBeInTheDocument();
    expect(screen.getByText(/NAME: Ada Lovelace/)).toBeInTheDocument();
  });

  it("shows loading and error states", () => {
    detailState.isLoadingDetail = true;
    detailState.detailError = "Not signed in.";
    renderWithProviders(
      <PaymentHistoryDetailModal
        row={makePaymentRow()}
        isOpen
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Loading details…")).toBeInTheDocument();
    expect(screen.getByText(/Not signed in\./)).toBeInTheDocument();
  });

  it("calls onClose from Close", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <PaymentHistoryDetailModal
        row={makePaymentRow()}
        isOpen
        onClose={onClose}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
