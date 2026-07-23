/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createMockAgendarFormState } from "../tests/helpers/mockAgendarFormState";
import { sampleAgendarCatalog } from "../tests/fixtures/catalog.fixture";
import { AgendarMobileSectionModals } from "./AgendarMobileSectionModals";

describe("AgendarMobileSectionModals", () => {
  it("opens the event setup modal for the event section", async () => {
    const form = createMockAgendarFormState({ mobileSectionModal: "event" });
    render(<AgendarMobileSectionModals form={form} catalog={sampleAgendarCatalog} />);

    expect(
      await screen.findByRole("heading", { name: /event setup/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/select event type/i)).toBeInTheDocument();
  });

  it("opens logistics modal with location", async () => {
    const form = createMockAgendarFormState({ mobileSectionModal: "logistics" });
    render(<AgendarMobileSectionModals form={form} catalog={sampleAgendarCatalog} />);

    expect(
      await screen.findByRole("heading", { name: /when & where/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^location$/i)).toBeInTheDocument();
  });

  it("opens client modal", async () => {
    const form = createMockAgendarFormState({ mobileSectionModal: "client" });
    render(<AgendarMobileSectionModals form={form} catalog={sampleAgendarCatalog} />);

    expect(
      await screen.findByRole("heading", { name: /client & notes/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/client — name/i)).toBeInTheDocument();
  });
});
