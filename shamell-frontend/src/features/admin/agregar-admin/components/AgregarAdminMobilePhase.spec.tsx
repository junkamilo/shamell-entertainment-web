/** @vitest-environment jsdom */

import type React from "react";
import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { createMockAgregarAdminPageState } from "../test/helpers/mockAgregarAdminPage";

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

import AgregarAdminMobilePhase from "./AgregarAdminMobilePhase";

describe("AgregarAdminMobilePhase", () => {
  it("shows details card content in phase 1", () => {
    const page = createMockAgregarAdminPageState({
      form: { phase: 1 },
    });
    renderWithProviders(<AgregarAdminMobilePhase page={page as never} />);

    expect(screen.getByText("EMAIL")).toBeInTheDocument();
    expect(screen.getByText("FULL NAME")).toBeInTheDocument();
    expect(screen.queryByText("VERIFICATION")).not.toBeInTheDocument();
  });

  it("shows verification card content in phase 2", () => {
    const page = createMockAgregarAdminPageState({
      form: { phase: 2 },
    });
    renderWithProviders(<AgregarAdminMobilePhase page={page as never} />);

    expect(screen.getByText("VERIFICATION")).toBeInTheDocument();
    expect(screen.getByText("VERIFICATION CODE")).toBeInTheDocument();
  });
});
