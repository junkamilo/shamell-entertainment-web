/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/admin/agregar-admin/support/helpers/renderWithProviders";
import { createMockAgregarAdminPageState } from "@test/features/admin/agregar-admin/support/helpers/mockAgregarAdminPage";

vi.mock("@/features/admin/agregar-admin/components/AgregarAdminMobilePhase", () => ({
  default: () => <div data-testid="agregar-admin-mobile-phase" />,
}));

vi.mock("@/features/admin/agregar-admin/components/AgregarAdminDetailsCard", () => ({
  default: () => <div data-testid="agregar-admin-details-card" />,
}));

vi.mock("@/features/admin/agregar-admin/components/AgregarAdminVerifyCard", () => ({
  default: () => <div data-testid="agregar-admin-verify-card" />,
}));

import AgregarAdminOnboardingSection from "@/features/admin/agregar-admin/components/AgregarAdminOnboardingSection";

describe("AgregarAdminOnboardingSection", () => {
  it("renders Administrator onboarding heading", () => {
    const page = createMockAgregarAdminPageState();
    renderWithProviders(
      <AgregarAdminOnboardingSection page={page as never} />,
    );

    expect(
      screen.getByRole("heading", { name: "Administrator onboarding" }),
    ).toBeInTheDocument();
  });

  it("renders mobile phase and desktop card stubs", () => {
    const page = createMockAgregarAdminPageState();
    renderWithProviders(
      <AgregarAdminOnboardingSection page={page as never} />,
    );

    expect(screen.getByTestId("agregar-admin-mobile-phase")).toBeInTheDocument();
    expect(screen.getByTestId("agregar-admin-details-card")).toBeInTheDocument();
    expect(screen.getByTestId("agregar-admin-verify-card")).toBeInTheDocument();
  });
});
