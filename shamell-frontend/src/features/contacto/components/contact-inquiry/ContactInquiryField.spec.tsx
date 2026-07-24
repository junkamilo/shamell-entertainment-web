/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import ContactInquiryField from "./ContactInquiryField";

describe("ContactInquiryField", () => {
  it("renders label and calls onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <ContactInquiryField
        label="Full name"
        name="fullName"
        value=""
        onChange={onChange}
        required
      />,
    );
    expect(screen.getByLabelText(/full name/i)).toBeRequired();
    await user.type(screen.getByLabelText(/full name/i), "Ada");
    expect(onChange).toHaveBeenCalled();
  });

  it("shows optional hint text", () => {
    renderWithProviders(
      <ContactInquiryField
        label="Phone"
        name="phone"
        value=""
        onChange={vi.fn()}
        hint="Include country code."
      />,
    );
    expect(screen.getByText("Include country code.")).toBeInTheDocument();
  });
});
