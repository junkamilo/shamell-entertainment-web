/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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

import { ModuleHero } from "./ModuleHero";

describe("ModuleHero", () => {
  it("renders title and default eyebrow", () => {
    render(<ModuleHero title="Events" />);
    expect(screen.getByRole("heading", { name: "Events" })).toBeInTheDocument();
    expect(screen.getByText("SHAMELL ADMIN")).toBeInTheDocument();
  });

  it("renders subtitle", () => {
    render(<ModuleHero title="Events" subtitle="Manage catalog" />);
    expect(screen.getByText("Manage catalog")).toBeInTheDocument();
  });

  it("renders primary as link when actionHref is set", () => {
    render(
      <ModuleHero title="Events" actionLabel="New event" actionHref="/admin/events/new" />,
    );
    const link = screen.getByRole("link", { name: "+ New event" });
    expect(link).toHaveAttribute("href", "/admin/events/new");
  });

  it("renders primary as button when onAction is set", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    render(<ModuleHero title="Events" actionLabel="New event" onAction={onAction} />);
    await user.click(screen.getByRole("button", { name: "+ New event" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("calls onSecondaryAction", async () => {
    const user = userEvent.setup();
    const onSecondaryAction = vi.fn();
    render(
      <ModuleHero
        title="Events"
        secondaryActionLabel="Export"
        onSecondaryAction={onSecondaryAction}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Export/ }));
    expect(onSecondaryAction).toHaveBeenCalledTimes(1);
  });

  it("renders extraActions", () => {
    render(
      <ModuleHero title="Events" extraActions={<button type="button">Tabs</button>} />,
    );
    expect(screen.getByRole("button", { name: "Tabs" })).toBeInTheDocument();
  });

  it("omits admin-panel when bordered is false", () => {
    const { container } = render(<ModuleHero title="Events" bordered={false} />);
    expect(container.firstElementChild?.className).not.toContain("admin-panel");
    expect(container.firstElementChild?.className).toContain("bg-transparent");
  });

  it("omits plus when primaryPrefix is false", () => {
    render(
      <ModuleHero
        title="Agenda"
        actionLabel="View calendar"
        onAction={vi.fn()}
        primaryPrefix={false}
      />,
    );
    expect(screen.getByRole("button", { name: "View calendar" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ View calendar" })).not.toBeInTheDocument();
  });

  it("omits secondary icon when secondaryIcon is null", () => {
    const { container } = render(
      <ModuleHero
        title="Events"
        secondaryActionLabel="Export"
        onSecondaryAction={vi.fn()}
        secondaryIcon={null}
      />,
    );
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });
});
