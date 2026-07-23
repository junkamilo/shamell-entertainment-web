/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("./MiAgendaPageContent", () => ({
  default: () => <div data-testid="mi-agenda-page-content" />,
}));

import MiAgendaPage from "./MiAgendaPage";

describe("MiAgendaPage", () => {
  it("renders the page content shell", () => {
    renderWithProviders(<MiAgendaPage />);
    expect(screen.getByTestId("mi-agenda-page-content")).toBeInTheDocument();
  });
});
