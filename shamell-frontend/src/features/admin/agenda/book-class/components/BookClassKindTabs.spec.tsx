/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { BookClassKindTabs } from "./BookClassKindTabs";

const ACTIVE_CLASS = "bg-gold/12";
const INACTIVE_CLASS = "text-foreground/60";

describe("BookClassKindTabs", () => {
  it("highlights PRIVATE when it is the active kind", () => {
    renderWithProviders(
      <BookClassKindTabs activeKind="private" onKindChange={vi.fn()} />,
    );

    expect(screen.getByTestId("book-class-kind-private")).toHaveClass(
      ACTIVE_CLASS,
    );
    expect(screen.getByTestId("book-class-kind-group")).toHaveClass(
      INACTIVE_CLASS,
    );
  });

  it("highlights GROUP when it is the active kind", () => {
    renderWithProviders(
      <BookClassKindTabs activeKind="group" onKindChange={vi.fn()} />,
    );

    expect(screen.getByTestId("book-class-kind-group")).toHaveClass(
      ACTIVE_CLASS,
    );
    expect(screen.getByTestId("book-class-kind-private")).toHaveClass(
      INACTIVE_CLASS,
    );
  });

  it("notifies when PRIVATE or GROUP is clicked", async () => {
    const user = userEvent.setup();
    const onKindChange = vi.fn();
    renderWithProviders(
      <BookClassKindTabs activeKind="group" onKindChange={onKindChange} />,
    );

    await user.click(screen.getByTestId("book-class-kind-private"));
    expect(onKindChange).toHaveBeenCalledWith("private");

    await user.click(screen.getByTestId("book-class-kind-group"));
    expect(onKindChange).toHaveBeenCalledWith("group");
  });
});
