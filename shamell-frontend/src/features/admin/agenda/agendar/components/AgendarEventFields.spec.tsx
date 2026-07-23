/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockAgendarFormState } from "../tests/helpers/mockAgendarFormState";
import { sampleAgendarCatalog } from "../tests/fixtures/catalog.fixture";
import { FIXTURE_EVENT_TYPE_ID, FIXTURE_OCCASION_ID } from "../tests/fixtures/uuids.fixture";
import { AgendarEventFields } from "./AgendarEventFields";

describe("AgendarEventFields", () => {
  it("renders catalog selectors", () => {
    const form = createMockAgendarFormState();
    render(<AgendarEventFields catalog={sampleAgendarCatalog} form={form} />);

    expect(screen.getByText("EVENT TYPE")).toBeInTheDocument();
    expect(screen.getByText("OCCASION")).toBeInTheDocument();
    expect(screen.getByText("SERVICES")).toBeInTheDocument();
    expect(screen.getByLabelText(/select event type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/select occasion/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^services$/i)).toBeInTheDocument();
  });

  it("forwards event type selection", async () => {
    const user = userEvent.setup();
    const form = createMockAgendarFormState();
    render(<AgendarEventFields catalog={sampleAgendarCatalog} form={form} />);

    await user.click(screen.getByLabelText(/select event type/i));
    await user.click(screen.getByRole("option", { name: /corporate/i }));
    expect(form.setEventTypeId).toHaveBeenCalledWith(FIXTURE_EVENT_TYPE_ID);
  });

  it("forwards occasion selection", async () => {
    const user = userEvent.setup();
    const form = createMockAgendarFormState();
    render(<AgendarEventFields catalog={sampleAgendarCatalog} form={form} />);

    await user.click(screen.getByLabelText(/select occasion/i));
    await user.click(screen.getByRole("option", { name: /gala/i }));
    expect(form.setOccasionTypeId).toHaveBeenCalledWith(FIXTURE_OCCASION_ID);
  });
});
