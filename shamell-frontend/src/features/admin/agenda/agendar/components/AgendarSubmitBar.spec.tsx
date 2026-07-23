/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgendarSubmitBar } from "./AgendarSubmitBar";

describe("AgendarSubmitBar", () => {
  it("shows create label on desktop", () => {
    render(<AgendarSubmitBar isEditMode={false} submitting={false} variant="desktop" />);
    expect(screen.getByTestId("agendar-submit")).toHaveTextContent(/create booking/i);
  });

  it("shows save label in edit mode", () => {
    render(<AgendarSubmitBar isEditMode submitting={false} variant="desktop" />);
    expect(screen.getByTestId("agendar-submit")).toHaveTextContent(/save booking/i);
  });

  it("disables the button while submitting", () => {
    render(<AgendarSubmitBar isEditMode={false} submitting variant="mobile-fixed" />);
    expect(screen.getByTestId("agendar-submit")).toBeDisabled();
  });
});
