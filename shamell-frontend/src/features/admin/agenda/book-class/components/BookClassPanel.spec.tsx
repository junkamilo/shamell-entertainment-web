/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

const { useBookClassKindMock, dynamicState } = vi.hoisted(() => ({
  useBookClassKindMock: vi.fn(),
  dynamicState: { promise: undefined as Promise<unknown> | undefined },
}));

vi.mock("../hooks/useBookClassKind", () => ({
  useBookClassKind: () => useBookClassKindMock(),
}));

vi.mock("./PrivateClassForm", () => ({
  PrivateClassForm: () => <div data-testid="private-class-form" />,
}));

vi.mock("./BookClassForm", () => ({
  BookClassForm: () => <div data-testid="book-class-form-impl" />,
}));

vi.mock("next/dynamic", () => ({
  default: (
    loader: () => Promise<{ default: unknown }>,
    options?: { loading?: () => unknown },
  ) => {
    dynamicState.promise = loader();
    options?.loading?.();
    return function BookClassFormStub() {
      return <div data-testid="book-class-form" />;
    };
  },
}));

import { BookClassPanel } from "./BookClassPanel";

describe("BookClassPanel", () => {
  beforeEach(() => {
    useBookClassKindMock.mockReset();
  });

  it("shows the private class form when kind is private", () => {
    useBookClassKindMock.mockReturnValue({
      classKind: "private",
      setClassKind: vi.fn(),
    });
    renderWithProviders(<BookClassPanel />);

    expect(screen.getByTestId("private-class-form")).toBeInTheDocument();
    expect(screen.queryByTestId("book-class-form")).not.toBeInTheDocument();
    expect(screen.getByTestId("book-class-kind-private")).toHaveClass(
      "bg-gold/12",
    );
  });

  it("shows the group class form when kind is group", () => {
    useBookClassKindMock.mockReturnValue({
      classKind: "group",
      setClassKind: vi.fn(),
    });
    renderWithProviders(<BookClassPanel />);

    expect(screen.getByTestId("book-class-form")).toBeInTheDocument();
    expect(screen.queryByTestId("private-class-form")).not.toBeInTheDocument();
    expect(screen.getByTestId("book-class-kind-group")).toHaveClass(
      "bg-gold/12",
    );
  });

  it("forwards tab changes to setClassKind", async () => {
    const user = userEvent.setup();
    const setClassKind = vi.fn();
    useBookClassKindMock.mockReturnValue({
      classKind: "private",
      setClassKind,
    });
    renderWithProviders(<BookClassPanel />);

    await user.click(screen.getByTestId("book-class-kind-group"));
    expect(setClassKind).toHaveBeenCalledWith("group");
  });

  it("resolves the dynamic BookClassForm loader", async () => {
    useBookClassKindMock.mockReturnValue({
      classKind: "private",
      setClassKind: vi.fn(),
    });
    renderWithProviders(<BookClassPanel />);
    await expect(dynamicState.promise).resolves.toMatchObject({
      default: expect.any(Function),
    });
  });
});
