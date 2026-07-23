/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { AGENDA_HUB_PATH } from "@/lib/admin/routes";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { createMockAgregarAdminPageState } from "../test/helpers/mockAgregarAdminPage";

const replace = vi.fn();
let permissions: string[] = ["admin.invite"];
let isLoggedIn = true;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("@/features/admin/auth/hooks/useAdminSession", () => ({
  useAdminSession: () => ({ permissions, isLoggedIn }),
}));

vi.mock("../hooks/useAgregarAdminPage", () => ({
  useAgregarAdminPage: () => createMockAgregarAdminPageState(),
}));

vi.mock("./AgregarAdminProgressBar", () => ({
  default: () => <div data-testid="agregar-admin-progress-bar" />,
}));

vi.mock("./AgregarAdminStepPills", () => ({
  default: () => <div data-testid="agregar-admin-step-pills" />,
}));

vi.mock("./AgregarAdminOnboardingSection", () => ({
  default: () => <div data-testid="agregar-admin-onboarding-section" />,
}));

vi.mock("@/components/admin/layout", () => ({
  ModuleHero: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

import AgregarAdminPageContent from "./AgregarAdminPageContent";

describe("AgregarAdminPageContent", () => {
  beforeEach(() => {
    replace.mockClear();
    permissions = ["admin.invite"];
    isLoggedIn = true;
  });

  it("shows Add administrator when canInvite", () => {
    renderWithProviders(<AgregarAdminPageContent />);

    expect(
      screen.getByRole("heading", { name: "Add administrator" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("agregar-admin-progress-bar")).toBeInTheDocument();
    expect(screen.getByTestId("agregar-admin-step-pills")).toBeInTheDocument();
    expect(
      screen.getByTestId("agregar-admin-onboarding-section"),
    ).toBeInTheDocument();
  });

  it("shows Redirecting… and replaces when !canInvite", async () => {
    permissions = [];
    renderWithProviders(<AgregarAdminPageContent />);

    expect(screen.getByText("Redirecting…")).toBeInTheDocument();
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith(AGENDA_HUB_PATH);
    });
  });

  it("does not redirect when not logged in even without invite permission", async () => {
    permissions = [];
    isLoggedIn = false;
    renderWithProviders(<AgregarAdminPageContent />);

    expect(screen.getByText("Redirecting…")).toBeInTheDocument();
    await waitFor(() => {
      expect(replace).not.toHaveBeenCalled();
    });
  });
});
