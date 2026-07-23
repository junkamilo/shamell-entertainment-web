/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { createMockAgregarAdminFormState } from "../test/helpers/mockAgregarAdminPage";
import AgregarAdminDetailsCard from "./AgregarAdminDetailsCard";

function renderCard(
  overrides: {
    phase?: 1 | 2;
    onEmailChange?: ReturnType<typeof vi.fn>;
    onFullNameChange?: ReturnType<typeof vi.fn>;
    onSubmit?: ReturnType<typeof vi.fn>;
    onEditEmailOrName?: ReturnType<typeof vi.fn>;
  } = {},
) {
  const form = createMockAgregarAdminFormState({
    phase: overrides.phase ?? 1,
  });
  const onEmailChange = overrides.onEmailChange ?? form.setEmail;
  const onFullNameChange = overrides.onFullNameChange ?? form.setFullName;
  const onSubmit =
    overrides.onSubmit ??
    vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
  const onEditEmailOrName = overrides.onEditEmailOrName ?? form.goToPhase1;

  renderWithProviders(
    <AgregarAdminDetailsCard
      phase={form.phase}
      layout="desktop"
      email={form.email}
      fullName={form.fullName}
      isSending={form.isSending}
      onEmailChange={onEmailChange}
      onFullNameChange={onFullNameChange}
      onSubmit={onSubmit}
      onEditEmailOrName={onEditEmailOrName}
    />,
  );

  return { form, onEmailChange, onFullNameChange, onSubmit, onEditEmailOrName };
}

describe("AgregarAdminDetailsCard", () => {
  it("shows email/name inputs and Send invitation in phase 1", () => {
    renderCard({ phase: 1 });

    expect(screen.getByText("EMAIL")).toBeInTheDocument();
    expect(screen.getByText("FULL NAME")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /send invitation/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /edit email or name/i }),
    ).not.toBeInTheDocument();
  });

  it("calls onEditEmailOrName in phase 2", async () => {
    const user = userEvent.setup();
    const onEditEmailOrName = vi.fn();
    renderCard({ phase: 2, onEditEmailOrName });

    await user.click(
      screen.getByRole("button", { name: /edit email or name/i }),
    );
    expect(onEditEmailOrName).toHaveBeenCalledOnce();
  });

  it("fires onChange callbacks for email and name", async () => {
    const user = userEvent.setup();
    const onEmailChange = vi.fn();
    const onFullNameChange = vi.fn();
    renderCard({
      phase: 1,
      onEmailChange,
      onFullNameChange,
    });

    const email = screen.getByPlaceholderText("new.admin@example.com");
    const name = screen.getByPlaceholderText("As shown in the admin panel");

    await user.clear(email);
    await user.type(email, "a@b.co");
    await user.clear(name);
    await user.type(name, "Ada");

    expect(onEmailChange).toHaveBeenCalled();
    expect(onFullNameChange).toHaveBeenCalled();
  });
});
