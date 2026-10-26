/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockEventTypesPageState } from "@test/features/admin/event-types/support/helpers/mockEventTypesPage";
import { renderWithProviders } from "@test/features/admin/event-types/support/helpers/renderWithProviders";

vi.mock("@/features/admin/event-types/hooks/useEventTypesPage", () => ({
  useEventTypesPage: () => createMockEventTypesPageState(),
}));

vi.mock("@/features/admin/event-types/components/EventTypesPageContent", () => ({
  default: () => <div data-testid="event-types-page-content" />,
}));

import EventTypesPage from "@/features/admin/event-types/components/EventTypesPage";

describe("EventTypesPage", () => {
  it("renders EventTypesPageContent", () => {
    renderWithProviders(<EventTypesPage />);
    expect(screen.getByTestId("event-types-page-content")).toBeInTheDocument();
  });

  it("loads page state via useEventTypesPage", () => {
    renderWithProviders(<EventTypesPage />);
    expect(screen.getByTestId("event-types-page-content")).toBeVisible();
  });
});
