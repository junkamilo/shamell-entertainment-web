/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import AgregarAdminStepPills from "./AgregarAdminStepPills";

describe("AgregarAdminStepPills", () => {
  it("renders STEP 1–4 labels", () => {
    renderWithProviders(<AgregarAdminStepPills phase={1} />);

    expect(screen.getByText("STEP 1")).toBeInTheDocument();
    expect(screen.getByText("STEP 2")).toBeInTheDocument();
    expect(screen.getByText("STEP 3")).toBeInTheDocument();
    expect(screen.getByText("STEP 4")).toBeInTheDocument();
  });

  it("renders step value titles", () => {
    renderWithProviders(<AgregarAdminStepPills phase={2} />);

    expect(screen.getByText("New administrator")).toBeInTheDocument();
    expect(screen.getByText("Email code")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(screen.getByText("Finish")).toBeInTheDocument();
  });
});
