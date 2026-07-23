/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockAgendarFormState } from "../tests/helpers/mockAgendarFormState";
import { AgendarClientFields, AgendarLocationField } from "./AgendarClientFields";

describe("AgendarClientFields", () => {
  it("renders client inputs and wires setters", async () => {
    const user = userEvent.setup();
    const form = createMockAgendarFormState({
      guestFullName: "",
      guestEmail: "",
      guestPhone: "",
      guestCount: "",
      notes: "",
    });
    render(<AgendarClientFields form={form} />);

    await user.type(screen.getByLabelText(/client — name/i), "Ana");
    expect(form.setGuestFullName).toHaveBeenCalled();

    await user.type(screen.getByLabelText(/^email$/i), "a@b.com");
    expect(form.setGuestEmail).toHaveBeenCalled();

    await user.type(screen.getByLabelText(/^phone$/i), "5551234567");
    expect(form.setGuestPhone).toHaveBeenCalled();

    await user.type(screen.getByLabelText(/guests/i), "12");
    expect(form.setGuestCount).toHaveBeenCalled();

    await user.type(screen.getByLabelText(/internal notes/i), "VIP");
    expect(form.setNotes).toHaveBeenCalled();
  });
});

describe("AgendarLocationField", () => {
  it("updates location from the input", async () => {
    const user = userEvent.setup();
    const form = createMockAgendarFormState({ location: "" });
    render(<AgendarLocationField form={form} />);

    await user.type(screen.getByLabelText(/^location$/i), "Miami");
    expect(form.setLocation).toHaveBeenCalled();
  });
});
