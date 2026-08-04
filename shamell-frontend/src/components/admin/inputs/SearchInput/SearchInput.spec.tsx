/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "./SearchInput";

describe("SearchInput", () => {
  it("calls onChange when typing", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} placeholder="Search events" />);
    await user.type(screen.getByRole("textbox", { name: "Search events" }), "g");
    expect(onChange).toHaveBeenCalledWith("g");
  });

  it("defaults aria-label to placeholder", () => {
    render(<SearchInput value="" onChange={vi.fn()} placeholder="Find…" />);
    expect(screen.getByRole("textbox", { name: "Find…" })).toBeInTheDocument();
  });

  it("uses explicit ariaLabel when provided", () => {
    render(
      <SearchInput
        value=""
        onChange={vi.fn()}
        placeholder="Search..."
        ariaLabel="Filter gallery"
      />,
    );
    expect(screen.getByRole("textbox", { name: "Filter gallery" })).toBeInTheDocument();
  });
});
