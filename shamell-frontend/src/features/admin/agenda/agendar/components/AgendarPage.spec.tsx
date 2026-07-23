/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("./AgendarPageContent", () => ({
  AgendarPageContent: () => <div data-testid="agendar-page-content">Page content</div>,
}));

import { AgendarPage } from "./AgendarPage";

describe("AgendarPage", () => {
  it("wraps page content in Suspense", () => {
    render(<AgendarPage />);
    expect(screen.getByTestId("agendar-page-content")).toBeInTheDocument();
  });
});
