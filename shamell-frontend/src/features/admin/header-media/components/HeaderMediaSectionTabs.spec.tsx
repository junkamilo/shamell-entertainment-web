/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import HeaderMediaSectionTabs from "./HeaderMediaSectionTabs";

describe("HeaderMediaSectionTabs", () => {
  it("renders Media and Text tabs", () => {
    renderWithProviders(
      <HeaderMediaSectionTabs activeTab="media" onTabChange={vi.fn()} />,
    );
    expect(screen.getByRole("tab", { name: "Media" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Text" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("notifies onTabChange", async () => {
    const user = userEvent.setup();
    const onTabChange = vi.fn();
    renderWithProviders(
      <HeaderMediaSectionTabs activeTab="media" onTabChange={onTabChange} />,
    );
    await user.click(screen.getByRole("tab", { name: "Text" }));
    expect(onTabChange).toHaveBeenCalledWith("text");
  });
});
