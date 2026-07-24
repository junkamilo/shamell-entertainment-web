/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

const routerReplace = vi.hoisted(() => vi.fn());
const submitConciergeInquiry = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplace }),
}));

vi.mock("next/image", () => ({
  default: () => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" />
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
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

describe("ConciergeInquiryForm", () => {
  it("renders concierge inquiry heading", () => {
    renderWithProviders(<ConciergeInquiryForm />);
    expect(
      screen.getByRole("heading", { name: /tell us your vision/i }),
    ).toBeInTheDocument();
  });

  it("validates required fields on submit", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<ConciergeInquiryForm />);
    await user.type(screen.getByLabelText(/full name/i), "A");
    await user.type(screen.getByLabelText(/^email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/tell us what you have in mind/i), "Too short");
    fireEvent.submit(container.querySelector("form")!);
    expect(screen.getByRole("alert")).toHaveTextContent(/full name|little more/i);
    expect(submitConciergeInquiry).not.toHaveBeenCalled();
  });

  it("submits concierge inquiry when form is valid", async () => {
    submitConciergeInquiry.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderWithProviders(<ConciergeInquiryForm />);

    await user.type(screen.getByLabelText(/full name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/^email/i), "ada@example.com");
    await user.type(
      screen.getByLabelText(/tell us what you have in mind/i),
      "We are planning a private celebration in Miami.",
    );
    await user.click(
      screen.getByRole("button", { name: /send concierge inquiry/i }),
    );

    expect(submitConciergeInquiry).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "Ada Lovelace",
        email: "ada@example.com",
      }),
    );
  });
});
