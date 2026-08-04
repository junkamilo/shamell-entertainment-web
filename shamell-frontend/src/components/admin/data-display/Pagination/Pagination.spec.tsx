/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "./Pagination";
import type { PaginationMeta } from "@/lib/pagination";

function meta(overrides: Partial<PaginationMeta> = {}): PaginationMeta {
  return {
    page: 1,
    perPage: 10,
    totalItems: 20,
    totalPages: 2,
    hasPrev: false,
    hasNext: true,
    ...overrides,
  };
}

describe("Pagination", () => {
  it("shows Showing range text", () => {
    render(
      <Pagination
        meta={meta()}
        onPageChange={vi.fn()}
        onPerPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Showing 1–10 of 20")).toBeInTheDocument();
  });

  it("calls onPageChange and onPerPageChange", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const onPerPageChange = vi.fn();
    render(
      <Pagination
        meta={meta()}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole("button", { name: "2" }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole("button", { name: "20" }));
    expect(onPerPageChange).toHaveBeenCalledWith(20);
  });

  it("disables previous on first page and next when hasNext is false", () => {
    render(
      <Pagination
        meta={meta({ hasPrev: false, hasNext: false, totalPages: 1 })}
        onPageChange={vi.fn()}
        onPerPageChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("renders at most 5 page buttons for enormous totalPages", () => {
    render(
      <Pagination
        meta={meta({
          page: 1,
          totalPages: 50_000,
          totalItems: 500_000,
          hasNext: true,
        })}
        onPageChange={vi.fn()}
        onPerPageChange={vi.fn()}
      />,
    );
    const prev = screen.getByRole("button", { name: "Previous page" });
    const next = screen.getByRole("button", { name: "Next page" });
    const nav = prev.parentElement;
    expect(nav).toBeTruthy();
    const pageButtons = Array.from(nav!.querySelectorAll("button")).filter(
      (btn) => btn !== prev && btn !== next,
    );
    expect(pageButtons).toHaveLength(5);
    expect(pageButtons.map((b) => b.textContent)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
    ]);
  });

  it("shows zero range when totalItems is 0", () => {
    render(
      <Pagination
        meta={meta({
          totalItems: 0,
          totalPages: 0,
          hasPrev: false,
          hasNext: false,
        })}
        onPageChange={vi.fn()}
        onPerPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Showing 0–0 of 0")).toBeInTheDocument();
  });
});
