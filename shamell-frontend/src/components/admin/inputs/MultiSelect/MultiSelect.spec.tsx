/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MultiSelect } from "./MultiSelect";

const options = [
  { id: "a", label: "Alpha" },
  { id: "b", label: "Beta" },
];

describe("MultiSelect", () => {
  it("opens and closes the listbox", async () => {
    const user = userEvent.setup();
    render(
      <MultiSelect options={options} value={["a"]} onChange={vi.fn()} ariaLabel="Pick" />,
    );
    const trigger = screen.getByRole("button", { name: "Pick" });
    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("toggles an additional option on", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MultiSelect options={options} value={["a"]} onChange={onChange} ariaLabel="Pick" />,
    );
    await user.click(screen.getByRole("button", { name: "Pick" }));
    await user.click(screen.getByRole("option", { name: "Beta" }));
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
  });

  it("does not clear the last selected option", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MultiSelect options={options} value={["a"]} onChange={onChange} ariaLabel="Pick" />,
    );
    await user.click(screen.getByRole("button", { name: "Pick" }));
    await user.click(screen.getByRole("option", { name: "Alpha" }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("exposes error via alert and aria-describedby", () => {
    render(
      <MultiSelect
        options={options}
        value={["a"]}
        onChange={vi.fn()}
        ariaLabel="Pick"
        error="Select at least one"
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Select at least one");
    const trigger = screen.getByRole("button", { name: "Pick" });
    expect(trigger).toHaveAttribute("aria-describedby", alert.id);
  });
});
