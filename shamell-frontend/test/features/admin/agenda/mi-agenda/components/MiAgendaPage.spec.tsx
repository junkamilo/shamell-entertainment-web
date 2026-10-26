/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@test/features/admin/agenda/mi-agenda/support/helpers/renderWithProviders";

vi.mock("@/features/admin/agenda/mi-agenda/components/MiAgendaPageContent", () => ({
  default: () => <div data-testid="mi-agenda-page-content" />,
}));

import MiAgendaPage from "@/features/admin/agenda/mi-agenda/components/MiAgendaPage";

describe("MiAgendaPage", () => {
  it("renders the page content shell", () => {
    renderWithProviders(<MiAgendaPage />);
    expect(screen.getByTestId("mi-agenda-page-content")).toBeInTheDocument();
  });
});
