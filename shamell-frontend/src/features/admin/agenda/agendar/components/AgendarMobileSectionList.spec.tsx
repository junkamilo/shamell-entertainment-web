/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockAgendarFormState } from "../tests/helpers/mockAgendarFormState";
import { AGENDAR_MOBILE_SECTIONS } from "../lib/agendarMobileSections";
import { AgendarMobileSectionList } from "./AgendarMobileSectionList";

describe("AgendarMobileSectionList", () => {
  it("lists every mobile section", () => {
    const form = createMockAgendarFormState();
    render(<AgendarMobileSectionList form={form} />);

    for (const row of AGENDAR_MOBILE_SECTIONS) {
      expect(screen.getByText(row.title)).toBeInTheDocument();
      expect(screen.getByText(row.subtitle)).toBeInTheDocument();
    }
  });

  it("opens a section modal when the eye button is clicked", async () => {
    const user = userEvent.setup();
    const form = createMockAgendarFormState();
    render(<AgendarMobileSectionList form={form} />);

    await user.click(screen.getByRole("button", { name: /open event setup/i }));
    expect(form.setMobileSectionModal).toHaveBeenCalledWith("event");
  });
});
