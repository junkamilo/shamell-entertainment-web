/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmailVerificationModal } from "./EmailVerificationModal";

describe("EmailVerificationModal", () => {
  it("shows the email and submits a 6-digit code", async () => {
    const user = userEvent.setup();
    const onVerify = vi.fn();
    render(
      <EmailVerificationModal
        open
        email="ada@example.com"
        onVerify={onVerify}
        onResend={() => {}}
        onClose={() => {}}
      />,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/enter the code we just sent to ada@example.com/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^verify$/i })).toBeDisabled();

    await user.type(screen.getByLabelText(/verification code/i), "482193");
    await user.click(screen.getByRole("button", { name: /^verify$/i }));
    expect(onVerify).toHaveBeenCalledWith("482193");
  });

  it("disables verify while checking and surfaces an error", () => {
    render(
      <EmailVerificationModal
        open
        email="ada@example.com"
        onVerify={() => {}}
        onResend={() => {}}
        onClose={() => {}}
        isVerifying
        error="Could not verify your email."
      />,
    );
    expect(screen.getByRole("button", { name: /verifying/i })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(/could not verify/i);
  });

  it("calls onClose from the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <EmailVerificationModal
        open
        email="ada@example.com"
        onVerify={() => {}}
        onResend={() => {}}
        onClose={onClose}
      />,
    );
    await user.click(screen.getByRole("button", { name: /^close$/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("does not close when clicking the backdrop", async () => {
    const onClose = vi.fn();
    render(
      <EmailVerificationModal
        open
        email="ada@example.com"
        onVerify={() => {}}
        onResend={() => {}}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("presentation"));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render a dialog when closed", () => {
    render(
      <EmailVerificationModal
        open={false}
        email="ada@example.com"
        onVerify={() => {}}
        onResend={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
