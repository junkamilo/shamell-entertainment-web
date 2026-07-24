/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import { RecurringClassSectionsEditor } from "./RecurringClassSectionsEditor";

const section = {
  weekday: 1,
  label: "Beginner",
  startTime: "19:00",
  endTime: "20:00",
  sortOrder: 0,
  defaultCapacity: "20",
  defaultPrice: "25",
};

describe("RecurringClassSectionsEditor", () => {
  it("prompts to select weekdays when none are active", () => {
    renderWithProviders(
      <RecurringClassSectionsEditor
        activeWeekdays={[]}
        sections={[]}
        onChange={vi.fn()}
        onPickTime={vi.fn()}
      />,
    );
    expect(
      screen.getByText(/Select at least one weekday to configure sections/),
    ).toBeInTheDocument();
  });

  it("renders day sections and shared hint", () => {
    renderWithProviders(
      <RecurringClassSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[section, { ...section, weekday: 3 }]}
        showSharedHint
        onChange={vi.fn()}
        onPickTime={vi.fn()}
      />,
    );
    expect(screen.getByText("INDIVIDUAL DAY OVERRIDES")).toBeInTheDocument();
    expect(screen.getByText(/Mon — 1 section/)).toBeInTheDocument();
    expect(screen.getByText(/Wed — 1 section/)).toBeInTheDocument();
  });

  it("adds a section for a day", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(
      <RecurringClassSectionsEditor
        activeWeekdays={[1]}
        sections={[section]}
        onChange={onChange}
        onPickTime={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Add section" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ weekday: 1, sortOrder: 0 }),
        expect.objectContaining({ weekday: 1, sortOrder: 1 }),
      ]),
    );
  });

  it("shows matches shared setup badge", () => {
    renderWithProviders(
      <RecurringClassSectionsEditor
        activeWeekdays={[1]}
        sections={[section]}
        sharedBlueprint={[
          {
            label: "Beginner",
            startTime: "19:00",
            endTime: "20:00",
            sortOrder: 0,
            defaultCapacity: "20",
            defaultPrice: "25",
          },
        ]}
        onChange={vi.fn()}
        onPickTime={vi.fn()}
      />,
    );
    expect(screen.getByText("Matches shared setup")).toBeInTheDocument();
  });
});
