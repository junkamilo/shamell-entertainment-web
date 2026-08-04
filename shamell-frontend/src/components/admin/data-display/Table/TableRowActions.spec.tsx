/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TableRowActions } from "./TableRowActions";

describe("TableRowActions", () => {
  it("renders children", () => {
    render(
      <TableRowActions>
        <button type="button">Edit</button>
        <button type="button">Delete</button>
      </TableRowActions>,
    );
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });
});
