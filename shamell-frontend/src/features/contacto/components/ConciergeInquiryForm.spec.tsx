/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

const routerReplace = vi.hoisted(() => vi.fn());
const submitConciergeInquiry = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplace,
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("next/image", () => ({
  default: () => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" />
  ),
}));

vi.mock("@/components/shared", () => ({
  ShamellBackButton: ({ label = "Back" }: { label?: string }) => (
    <button type="button" aria-label={label}>
      {label}
    </button>
  ),
}));

vi.mock("../services/submitConciergeInquiry", () => ({
  submitConciergeInquiry,
}));

vi.mock("./ContactDatePickerModal", () => ({
  default: () => null,
}));

vi.mock("./InquirySubmitFeedbackLayer", () => ({
  default: () => null,
}));

import ConciergeInquiryForm from "./ConciergeInquiryForm";

function fillField(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("ConciergeInquiryForm", () => {
  it("renders concierge inquiry heading", () => {
    renderWithProviders(<ConciergeInquiryForm />);
    expect(
      screen.getByRole("heading", { name: /tell us your vision/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^back$/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /back to inquiry options/i })).not.toBeInTheDocument();
  });

  it("validates required fields on submit", () => {
    const { container } = renderWithProviders(<ConciergeInquiryForm />);
    fillField(/full name/i, "A");
    fillField(/^email/i, "ada@example.com");
    fillField(/tell us what you have in mind/i, "Too short");
    fireEvent.submit(container.querySelector("form")!);
    expect(screen.getByRole("alert")).toHaveTextContent(/full name|little more/i);
    expect(submitConciergeInquiry).not.toHaveBeenCalled();
  });

  it("submits concierge inquiry when form is valid", async () => {
    submitConciergeInquiry.mockResolvedValue({ ok: true });
    const { container } = renderWithProviders(<ConciergeInquiryForm />);

    fillField(/full name/i, "Ada Lovelace");
    fillField(/^email/i, "ada@example.com");
    fillField(
      /tell us what you have in mind/i,
      "We are planning a private celebration in Miami.",
    );
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() =>
      expect(submitConciergeInquiry).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Ada Lovelace",
          email: "ada@example.com",
        }),
      ),
    );
  });
});
