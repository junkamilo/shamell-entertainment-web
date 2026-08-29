/** @vitest-environment jsdom */

import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import type { ClassSectionBlueprint } from "../lib/recurringClassSectionsBulk.util";
import type { ClassSectionFormRow } from "../types/reservationEventTemplate.types";

const applyOverride = vi.hoisted(() => ({
  current: null as null | ((...args: unknown[]) => unknown),
}));

vi.mock("@/components/admin/overlays", () => ({
  Modal: ({
    isOpen,
    onClose,
    title,
    children,
  }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
        <button type="button" onClick={onClose}>
          Close dialog
        </button>
      </div>
    ) : null,
}));

vi.mock("../lib/recurringClassSectionsBulk.util", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../lib/recurringClassSectionsBulk.util")>();
  return {
    ...actual,
    applyBlueprintToWeekdays: (...args: unknown[]) =>
      applyOverride.current
        ? applyOverride.current(...args)
        : actual.applyBlueprintToWeekdays(
            ...(args as Parameters<typeof actual.applyBlueprintToWeekdays>),
          ),
  };
});

import { RecurringClassBulkSectionsEditor } from "./RecurringClassBulkSectionsEditor";

const completeBlueprint: ClassSectionBlueprint[] = [
  {
    label: "Morning",
    startTime: "10:00",
    endTime: "12:00",
    sortOrder: 0,
    defaultCapacity: "20",
    defaultPrice: "25",
  },
];

function section(
  weekday: number,
  overrides: Partial<ClassSectionFormRow> = {},
): ClassSectionFormRow {
  return {
    weekday,
    label: "Existing",
    startTime: "09:00",
    endTime: "10:00",
    sortOrder: 0,
    defaultCapacity: "10",
    defaultPrice: "15",
    ...overrides,
  };
}

describe("RecurringClassBulkSectionsEditor", () => {
  beforeEach(() => {
    applyOverride.current = null;
  });

  it("returns null with fewer than two active weekdays", () => {
    const { container } = renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1]}
        sections={[]}
        blueprint={completeBlueprint}
        onBlueprintChange={vi.fn()}
        onApply={vi.fn()}
        onPickTime={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders shared setup and uses numeric labels for unknown weekdays", () => {
    renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[8, 9]}
        sections={[]}
        blueprint={completeBlueprint}
        onBlueprintChange={vi.fn()}
        onApply={vi.fn()}
        onPickTime={vi.fn()}
      />,
    );
    expect(screen.getByText(/SHARED SETUP \(8, 9\)/i)).toBeInTheDocument();
    expect(screen.getByText(/1 template section$/i)).toBeInTheDocument();
  });

  it("applies blueprint to empty days", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[]}
        blueprint={completeBlueprint}
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
    expect(screen.getByRole("status")).toHaveTextContent(/Applied to Mon, Wed/);
  });

  it("skips days that already have sections when filling empty days", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[section(1)]}
        blueprint={completeBlueprint}
        onBlueprintChange={vi.fn()}
        onApply={onApply}
        onPickTime={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Apply to days without sections/i }));
    expect(onApply).toHaveBeenCalledWith(
      expect.any(Array),
      expect.stringMatching(/Skipped \(already configured\): Mon/),
    );
  });

  it("shows a fill-empty notice when the apply result has no days to fill", async () => {
    const user = userEvent.setup();
    applyOverride.current = () => ({
      sections: [],
      filledWeekdays: [],
      skippedWeekdays: [],
      error: null,
    });
    renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[]}
        blueprint={completeBlueprint}
        onBlueprintChange={vi.fn()}
        onApply={vi.fn()}
        onPickTime={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Apply to days without sections/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/No empty days to fill/);
  });

  it("labels skipped unknown weekdays with their numeric id", async () => {
    const user = userEvent.setup();
    applyOverride.current = () => ({
      sections: [],
      filledWeekdays: [8],
      skippedWeekdays: [9],
      error: null,
    });
    renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[]}
        blueprint={completeBlueprint}
        onBlueprintChange={vi.fn()}
        onApply={vi.fn()}
        onPickTime={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Apply to days without sections/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/Applied to 8/);
    expect(screen.getByRole("status")).toHaveTextContent(/Skipped \(already configured\): 9/);
  });

  it("surfaces apply errors without calling onApply", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    applyOverride.current = () => ({
      sections: [],
      filledWeekdays: [],
      skippedWeekdays: [],
      error: "Nope",
    });
    renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[]}
        blueprint={completeBlueprint}
        onBlueprintChange={vi.fn()}
        onApply={onApply}
        onPickTime={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Apply to days without sections/i }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent("Nope");
  });

  it("confirms overwrite of all active days", async () => {
    const user = userEvent.setup();
    const onApply = vi.fn();
    renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[section(1)]}
        blueprint={completeBlueprint}
        onBlueprintChange={vi.fn()}
        onApply={onApply}
        onPickTime={vi.fn()}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /Apply to all active days \(overwrite\)/i }),
    );
    expect(
      screen.getByRole("dialog", { name: "Overwrite all active days?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog", { name: "Overwrite all active days?" })).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Apply to all active days \(overwrite\)/i }),
    );
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(screen.queryByRole("dialog", { name: "Overwrite all active days?" })).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Apply to all active days \(overwrite\)/i }),
    );
    await user.click(screen.getByRole("button", { name: "Confirm overwrite" }));
    expect(onApply).toHaveBeenCalledWith(
      expect.any(Array),
      expect.stringMatching(/Replaced sections on all active days \(Mon, Wed\)/),
    );
  });

  it("adds the first template section when the blueprint is empty", async () => {
    const user = userEvent.setup();
    const onBlueprintChange = vi.fn();
    renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[]}
        blueprint={[]}
        onBlueprintChange={onBlueprintChange}
        onApply={vi.fn()}
        onPickTime={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Add section" }));
    expect(onBlueprintChange).toHaveBeenCalledWith([
      expect.objectContaining({ sortOrder: 0, startTime: "10:00", endTime: "12:00" }),
    ]);
  });

  it("adds, patches, removes, and picks blueprint times", async () => {
    const user = userEvent.setup();
    const onBlueprintChange = vi.fn();
    const onPickTime = vi.fn();
    const twoSections: ClassSectionBlueprint[] = [
      ...completeBlueprint,
      {
        label: "Evening",
        startTime: "18:00",
        endTime: "20:00",
        sortOrder: 1,
        defaultCapacity: "12",
        defaultPrice: "30",
      },
    ];
    const { rerender } = renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[]}
        blueprint={completeBlueprint}
        onBlueprintChange={onBlueprintChange}
        onApply={vi.fn()}
        onPickTime={onPickTime}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Add section" }));
    expect(onBlueprintChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ sortOrder: 0 }),
        expect.objectContaining({
          sortOrder: 1,
          startTime: "12:00",
          endTime: "14:00",
        }),
      ]),
    );

    rerender(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[]}
        blueprint={twoSections}
        onBlueprintChange={onBlueprintChange}
        onApply={vi.fn()}
        onPickTime={onPickTime}
      />,
    );
    expect(screen.getByText(/2 template sections/i)).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue("Morning"), {
      target: { value: "Morning class" },
    });
    expect(onBlueprintChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ label: "Morning class" })]),
    );
    await user.click(screen.getByRole("button", { name: "Remove section 1" }));
    expect(onBlueprintChange).toHaveBeenCalledWith([
      expect.objectContaining({ label: "Evening", sortOrder: 0 }),
    ]);
    await user.click(screen.getAllByText("Start")[0]!.closest("button")!);
    expect(onPickTime).toHaveBeenCalledWith(0, "start");
  });

  it("warns about overlapping template times and incomplete fields", () => {
    renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[]}
        blueprint={[
          {
            label: "A",
            startTime: "10:00",
            endTime: "12:00",
            sortOrder: 0,
            defaultCapacity: "10",
            defaultPrice: "25",
          },
          {
            label: "B",
            startTime: "11:00",
            endTime: "13:00",
            sortOrder: 1,
            defaultCapacity: "10",
            defaultPrice: "25",
          },
        ]}
        onBlueprintChange={vi.fn()}
        onApply={vi.fn()}
        onPickTime={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/overlaps/i);
  });

  it("shows incomplete-field copy and disables apply when every day already has sections", () => {
    renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[]}
        blueprint={[
          {
            label: "",
            startTime: "10:00",
            endTime: "12:00",
            sortOrder: 0,
            defaultCapacity: "",
            defaultPrice: "",
          },
        ]}
        onBlueprintChange={vi.fn()}
        onApply={vi.fn()}
        onPickTime={vi.fn()}
        disabled
      />,
    );
    expect(screen.getAllByText(/Fill label, times, capacity, and price/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Add section" })).toBeDisabled();
  });

  it("disables fill-empty when every active day already has sections", () => {
    renderWithProviders(
      <RecurringClassBulkSectionsEditor
        activeWeekdays={[1, 3]}
        sections={[section(1), section(3)]}
        blueprint={completeBlueprint}
        onBlueprintChange={vi.fn()}
        onApply={vi.fn()}
        onPickTime={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Apply to days without sections/i }),
    ).toBeDisabled();
  });
});
