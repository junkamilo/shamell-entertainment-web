/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { createMockEventTypesPageState } from "../test/helpers/mockEventTypesPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("../hooks/useEventTypesPage", () => ({
  useEventTypesPage: () => createMockEventTypesPageState(),
}));

vi.mock("./EventTypesPageContent", () => ({
  default: () => <div data-testid="event-types-page-content" />,
}));

import EventTypesPage from "./EventTypesPage";

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
