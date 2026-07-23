/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { createMockAgregarAdminFormState } from "../test/helpers/mockAgregarAdminPage";
import AgregarAdminVerifyCard from "./AgregarAdminVerifyCard";

function renderCard(
  overrides: {
    phase?: 1 | 2;
    onCodeChange?: ReturnType<typeof vi.fn>;
    onPasswordChange?: ReturnType<typeof vi.fn>;
    onSubmit?: ReturnType<typeof vi.fn>;
    onResendCode?: ReturnType<typeof vi.fn>;
  } = {},
) {
  const form = createMockAgregarAdminFormState({
    phase: overrides.phase ?? 1,
  });
  const onCodeChange = overrides.onCodeChange ?? form.setCode;
  const onPasswordChange = overrides.onPasswordChange ?? form.setPassword;
  const onSubmit =
    overrides.onSubmit ??
    vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
  const onResendCode = overrides.onResendCode ?? vi.fn();

  renderWithProviders(
    <AgregarAdminVerifyCard
      phase={form.phase}
      layout="desktop"
      emailDisplay={form.emailDisplay}
      code={form.code}
      password={form.password}
      isSending={form.isSending}
      isVerifying={form.isVerifying}
      onCodeChange={onCodeChange}
      onPasswordChange={onPasswordChange}
      onSubmit={onSubmit}
      onResendCode={onResendCode}
    />,
  );

  return { form, onCodeChange, onPasswordChange, onSubmit, onResendCode };
}

describe("AgregarAdminVerifyCard", () => {
  it("shows idle message in phase 1", () => {
    renderCard({ phase: 1 });

    expect(screen.getByText(/after you tap/i)).toBeInTheDocument();
    expect(screen.getByText("Send invitation")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add administrator/i }),
    ).not.toBeInTheDocument();
  });

  it("shows code/password form and actions in phase 2", () => {
    renderCard({ phase: 2 });

    expect(screen.getByText("VERIFICATION CODE")).toBeInTheDocument();
    expect(screen.getByText("NEW ADMIN PASSWORD")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add administrator/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send new code/i }),
    ).toBeInTheDocument();
  });

  it("calls onResendCode from Send new code", async () => {
    const user = userEvent.setup();
    const onResendCode = vi.fn();
    renderCard({ phase: 2, onResendCode });

    await user.click(screen.getByRole("button", { name: /send new code/i }));
    expect(onResendCode).toHaveBeenCalledOnce();
  });
});
