/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ShamellBackButton } from "./ShamellBackButton";

const back = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back, push }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("ShamellBackButton", () => {
  it("renders a Link when href is set", () => {
    render(<ShamellBackButton href="/on-coming-events" label="Back" />);
    const link = screen.getByRole("link", { name: "Back" });
    expect(link).toHaveAttribute("href", "/on-coming-events");
  });

  it("calls router.back when history exists and href is omitted", async () => {
    const user = userEvent.setup();
    const lengthSpy = vi
      .spyOn(window.history, "length", "get")
      .mockReturnValue(3);
    render(<ShamellBackButton label="Back" />);
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(back).toHaveBeenCalledTimes(1);
    lengthSpy.mockRestore();
  });
});
