/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import { RecurringClassBulkSectionsEditor } from "./RecurringClassBulkSectionsEditor";

const blueprint = [
  {
    label: "Morning",
    startTime: "10:00",
    endTime: "12:00",
    sortOrder: 0,
    defaultCapacity: "20",
    defaultPrice: "25",
  },
];

describe("RecurringClassBulkSectionsEditor", () => {
  it("returns null with fewer than two active weekdays", () => {
    const { container } = renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1]}
        sections={[]}
        blueprint={blueprint}
        onBlueprintChange={vi.fn()}
        onApply={vi.fn()}
        onPickTime={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders shared setup editor", () => {
    renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[]}
        blueprint={blueprint}
        onBlueprintChange={vi.fn()}
        onApply={vi.fn()}
        onPickTime={vi.fn()}
      />,
    );
    expect(screen.getByText(/SHARED SETUP \(MON, WED\)/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue("Morning")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Apply to days without sections/i }),
    ).toBeEnabled();
  });

  it("applies blueprint to empty days", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[]}
        blueprint={blueprint}
        onBlueprintChange={vi.fn()}
        onApply={onApply}
        onPickTime={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Apply to days without sections/i }));
    expect(onApply).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ weekday: 1, label: "Morning" }),
        expect.objectContaining({ weekday: 3, label: "Morning" }),
      ]),
      expect.stringMatching(/Applied to Mon, Wed/),
    );
  });

  it("opens overwrite confirmation modal", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[
          {
            weekday: 1,
            label: "Existing",
            startTime: "09:00",
            endTime: "10:00",
            sortOrder: 0,
            defaultCapacity: "10",
            defaultPrice: "15",
          },
        ]}
        blueprint={blueprint}
        onBlueprintChange={vi.fn()}
        onApply={vi.fn()}
        onPickTime={vi.fn()}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /Apply to all active days \(overwrite\)/i }),
    );
    expect(
      screen.getByRole("dialog", { name: "Overwrite all active days?" }),
    ).toBeInTheDocument();
  });

  it("adds a blueprint section", async () => {
    const user = userEvent.setup();
    const onBlueprintChange = vi.fn();
    renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[]}
        blueprint={blueprint}
        onBlueprintChange={onBlueprintChange}
        onApply={vi.fn()}
        onPickTime={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Add section" }));
    expect(onBlueprintChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ sortOrder: 0 }),
        expect.objectContaining({ sortOrder: 1, label: "" }),
      ]),
    );
  });
});
