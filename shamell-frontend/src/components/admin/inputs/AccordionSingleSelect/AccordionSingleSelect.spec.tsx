/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccordionSingleSelect } from "./AccordionSingleSelect";

const options = [
  { id: "a", label: "Alpha" },
  { id: "b", label: "Beta" },
];

describe("AccordionSingleSelect", () => {
  it("picks an option and closes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AccordionSingleSelect
        options={options}
        value=""
        onChange={onChange}
        ariaLabel="Pick one"
        showNoneOption
      />,
    );
    await user.click(screen.getByRole("button", { name: "Pick one" }));
    await user.click(screen.getByRole("option", { name: "Beta" }));
    expect(onChange).toHaveBeenCalledWith("b");
    expect(screen.getByRole("button", { name: "Pick one" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await waitFor(() =>
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument(),
    );
  });

  it("includes a none option when showNoneOption is true", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AccordionSingleSelect
        options={options}
        value="a"
        onChange={onChange}
        ariaLabel="Pick one"
        emptyDisplay="None"
        showNoneOption
      />,
    );
    await user.click(screen.getByRole("button", { name: "Pick one" }));
    await user.click(screen.getByRole("option", { name: "None" }));
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("sets aria-required when required", () => {
    render(
      <AccordionSingleSelect
        options={options}
        value="a"
        onChange={vi.fn()}
        ariaLabel="Status"
        required
        showNoneOption={false}
      />,
    );
    expect(screen.getByRole("button", { name: "Status" })).toHaveAttribute(
      "aria-required",
      "true",
    );
  });
});
