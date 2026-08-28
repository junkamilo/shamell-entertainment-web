/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ShamellTime12hColumns from "./ShamellTime12hColumns";
import type { ShamellTime12hParts } from "./ShamellTime12hColumns";

const NOON: ShamellTime12hParts = { h12: 12, min: 0, ap: "PM" };
const TEN_AM: ShamellTime12hParts = { h12: 10, min: 30, ap: "AM" };

function hourBtn(n: number) {
  return document.querySelector(`[data-hour="${n}"]`) as HTMLElement;
}

function minuteBtn(n: number) {
  return document.querySelector(`[data-minute="${n}"]`) as HTMLElement;
}

function renderPicker(
  overrides: Partial<React.ComponentProps<typeof ShamellTime12hColumns>> = {},
) {
  const onChange = vi.fn();
  const props = {
    value: TEN_AM,
    onChange,
    ...overrides,
  };
  const view = render(<ShamellTime12hColumns {...props} />);
  return { ...view, onChange, props };
}

describe("ShamellTime12hColumns", () => {
  beforeEach(() => {
    HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  it("renders default labels and selects the current value", () => {
    renderPicker();
    expect(screen.getByText("HOUR")).toBeInTheDocument();
    expect(screen.getByText("MINUTE")).toBeInTheDocument();
    expect(screen.getByText("PERIOD")).toBeInTheDocument();
    expect(hourBtn(10)).toHaveAttribute("aria-selected", "true");
    expect(minuteBtn(30)).toHaveAttribute("aria-selected", "true");
  });

  it("uses custom labels and className", () => {
    const { container } = renderPicker({
      labels: { hour: "Hr", minute: "Min", period: "AmPm" },
      className: "extra-class",
    });
    expect(screen.getByText("Hr")).toBeInTheDocument();
    expect(screen.getByText("Min")).toBeInTheDocument();
    expect(screen.getByText("AmPm")).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("extra-class");
  });

  it("emits hour, minute, and period clicks", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker();

    await user.click(hourBtn(3));
    expect(onChange).toHaveBeenCalledWith({ h12: 3, min: 30, ap: "AM" });

    await user.click(minuteBtn(5));
    expect(onChange).toHaveBeenCalledWith({ h12: 10, min: 5, ap: "AM" });

    await user.click(screen.getByRole("button", { name: "PM" }));
    expect(onChange).toHaveBeenCalledWith({ h12: 10, min: 30, ap: "PM" });
  });

  it("shows midnight/noon hints on hour 12", () => {
    renderPicker({ value: NOON });
    expect(
      screen.getByRole("option", {
        name: "12 — midnight with AM, noon with PM",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PM (Noon)" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "AM (Midnight)" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Noon")).toBeInTheDocument();
  });

  it("disables hours and minutes outside the clamp", () => {
    renderPicker({
      value: { h12: 2, min: 0, ap: "PM" },
      timeClamp: { minMinutes: 13 * 60, maxMinutes: 14 * 60 },
    });
    expect(hourBtn(10)).toBeDisabled();
    expect(hourBtn(2)).toBeEnabled();
  });

  it("does not emit from a disabled hour option", () => {
    const { onChange } = renderPicker({
      value: { h12: 2, min: 0, ap: "PM" },
      timeClamp: { minMinutes: 13 * 60, maxMinutes: 14 * 60 },
    });
    fireEvent.click(hourBtn(10));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("snaps the minute when the current one is blocked in the new hour", async () => {
    const user = userEvent.setup();
    const { onChange } = renderPicker({
      value: TEN_AM,
      blockedRanges: [{ startMinutes: 10 * 60 + 30, endMinutes: 10 * 60 + 30 }],
    });
    await user.click(hourBtn(10));
    expect(onChange.mock.calls[0]![0].min).not.toBe(30);
    expect(onChange.mock.calls[0]![0].h12).toBe(10);
  });

  it("navigates hours with keyboard", () => {
    const { onChange } = renderPicker({ value: { h12: 1, min: 0, ap: "AM" } });
    const hourBox = screen.getByRole("listbox", { name: "HOUR" });

    fireEvent.keyDown(hourBox, { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalledWith({ h12: 2, min: 0, ap: "AM" });

    onChange.mockClear();
    fireEvent.keyDown(hourBox, { key: "ArrowUp" });
    expect(onChange).toHaveBeenCalledWith({ h12: 12, min: 0, ap: "AM" });

    onChange.mockClear();
    fireEvent.keyDown(hourBox, { key: "Home" });
    expect(onChange).toHaveBeenCalledWith({ h12: 1, min: 0, ap: "AM" });

    onChange.mockClear();
    fireEvent.keyDown(hourBox, { key: "End" });
    expect(onChange).toHaveBeenCalledWith({ h12: 12, min: 0, ap: "AM" });

    onChange.mockClear();
    fireEvent.keyDown(hourBox, { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("skips hour keyboard navigation when the current hour is not in the list", () => {
    const { onChange } = renderPicker({ value: { h12: 99, min: 0, ap: "AM" } });
    fireEvent.keyDown(screen.getByRole("listbox", { name: "HOUR" }), {
      key: "ArrowDown",
    });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("navigates minutes with keyboard", () => {
    const { onChange } = renderPicker({ value: { h12: 10, min: 58, ap: "AM" } });
    const minuteBox = screen.getByRole("listbox", { name: "MINUTE" });

    fireEvent.keyDown(minuteBox, { key: "ArrowDown" });
    expect(onChange).toHaveBeenCalledWith({ h12: 10, min: 59, ap: "AM" });

    onChange.mockClear();
    fireEvent.keyDown(minuteBox, { key: "ArrowUp" });
    expect(onChange).toHaveBeenCalledWith({ h12: 10, min: 57, ap: "AM" });

    onChange.mockClear();
    fireEvent.keyDown(minuteBox, { key: "Home" });
    expect(onChange).toHaveBeenCalledWith({ h12: 10, min: 0, ap: "AM" });

    onChange.mockClear();
    fireEvent.keyDown(minuteBox, { key: "End" });
    expect(onChange).toHaveBeenCalledWith({ h12: 10, min: 59, ap: "AM" });
  });

  it("does not emit Home/End when no slot is selectable", () => {
    const { onChange } = renderPicker({
      timeClamp: { minMinutes: 1, maxMinutes: 0 },
    });
    const hourBox = screen.getByRole("listbox", { name: "HOUR" });
    const minuteBox = screen.getByRole("listbox", { name: "MINUTE" });
    fireEvent.keyDown(hourBox, { key: "Home" });
    fireEvent.keyDown(hourBox, { key: "End" });
    fireEvent.keyDown(hourBox, { key: "ArrowDown" });
    fireEvent.keyDown(minuteBox, { key: "Home" });
    fireEvent.keyDown(minuteBox, { key: "End" });
    fireEvent.keyDown(minuteBox, { key: "ArrowDown" });
    fireEvent.keyDown(minuteBox, { key: "ArrowUp" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("does not emit from a disabled minute option", () => {
    const { onChange } = renderPicker({
      value: TEN_AM,
      blockedRanges: [{ startMinutes: 10 * 60 + 5, endMinutes: 10 * 60 + 5 }],
    });
    fireEvent.click(minuteBtn(5));
    expect(onChange).not.toHaveBeenCalled();
  });
});
