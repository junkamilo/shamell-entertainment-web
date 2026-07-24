/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import PasswordField from "./PasswordField";

describe("PasswordField", () => {
  it("renders label and controlled input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <PasswordField label="Email" value="" onChange={onChange} type="email" />,
    );

    expect(screen.getByText("Email")).toBeInTheDocument();
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "email");
    await user.type(input, "a");
    expect(onChange).toHaveBeenCalled();
  });

  it("defaults to password type", () => {
    renderWithProviders(
      <PasswordField label="New password" value="secret" onChange={vi.fn()} />,
    );
    const input = document.querySelector("input");
    expect(input).toHaveAttribute("type", "password");
    expect(input).toHaveValue("secret");
  });
});
