/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { createMockAgregarAdminPageState } from "../test/helpers/mockAgregarAdminPage";

vi.mock("./AgregarAdminMobilePhase", () => ({
  default: () => <div data-testid="agregar-admin-mobile-phase" />,
}));

vi.mock("./AgregarAdminDetailsCard", () => ({
  default: () => <div data-testid="agregar-admin-details-card" />,
}));

vi.mock("./AgregarAdminVerifyCard", () => ({
  default: () => <div data-testid="agregar-admin-verify-card" />,
}));

import AgregarAdminOnboardingSection from "./AgregarAdminOnboardingSection";

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
