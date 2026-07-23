/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { LoginField } from "./LoginField";

describe("LoginField", () => {
  it("renders the Email label", () => {
    renderWithProviders(
      <LoginField label="Email" value="" onChange={vi.fn()} />,
    );

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("calls onChange when typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <LoginField label="Email" value="" onChange={onChange} />,
    );

    await user.type(screen.getByLabelText("Email"), "a");
    expect(onChange).toHaveBeenCalledWith("a");
  });

  it("renders type password when requested", () => {
    renderWithProviders(
      <LoginField
        label="Password"
        type="password"
        value=""
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
  });
});
