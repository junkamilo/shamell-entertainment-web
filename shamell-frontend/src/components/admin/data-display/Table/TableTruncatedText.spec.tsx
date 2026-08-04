/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TableTruncatedText } from "./TableTruncatedText";

describe("TableTruncatedText", () => {
  it("renders primary and secondary", () => {
    render(<TableTruncatedText primary="Main title" secondary="Subtitle" />);
    expect(screen.getByText("Main title")).toBeInTheDocument();
    expect(screen.getByText("Subtitle")).toBeInTheDocument();
  });

  it("shows em dash when primary is empty", () => {
    render(<TableTruncatedText primary="   " />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("sets title on truncated primary", () => {
    render(<TableTruncatedText primary="Long label" />);
    expect(screen.getByText("Long label")).toHaveAttribute("title", "Long label");
  });

  it("omits secondary when missing", () => {
    render(<TableTruncatedText primary="Only primary" />);
    expect(screen.getByText("Only primary")).toBeInTheDocument();
    expect(screen.queryByText("Subtitle")).not.toBeInTheDocument();
  });
});
