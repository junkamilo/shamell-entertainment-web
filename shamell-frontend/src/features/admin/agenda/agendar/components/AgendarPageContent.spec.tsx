/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const setBookMode = vi.fn();
let bookMode: "event" | "class" = "event";
let showClassTab = true;
let isEditMode = false;

vi.mock("../hooks/useAgendarEditModeFromQuery", () => ({
  useAgendarEditModeFromQuery: () => isEditMode,
}));

vi.mock("../hooks/useAgendarBookMode", () => ({
  useAgendarBookMode: () => ({
    bookMode,
    setBookMode,
    showClassTab,
  }),
}));

vi.mock("./AgendarEventBookingPanel", () => ({
  AgendarEventBookingPanel: () => <div>Event booking panel</div>,
}));

vi.mock("next/dynamic", () => ({
  default: () => {
    function PrivateClassStub() {
      return <div>Private class form</div>;
    }
    return PrivateClassStub;
  },
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

import { AgendarPageContent } from "./AgendarPageContent";

describe("AgendarPageContent", () => {
  beforeEach(() => {
    setBookMode.mockClear();
    bookMode = "event";
    showClassTab = true;
    isEditMode = false;
  });

  it("shows Book hero and the event panel by default", () => {
    render(<AgendarPageContent />);
    expect(screen.getByRole("heading", { name: /^book$/i })).toBeInTheDocument();
    expect(screen.getByTestId("agendar-event-panel")).toHaveTextContent(/event booking panel/i);
    expect(screen.queryByTestId("agendar-class-panel")).not.toBeInTheDocument();
  });

  it("shows Edit booking title in edit mode", () => {
    isEditMode = true;
    showClassTab = false;
    render(<AgendarPageContent />);
    expect(screen.getByRole("heading", { name: /edit booking/i })).toBeInTheDocument();
  });

  it("renders the class panel when bookMode is class", () => {
    bookMode = "class";
    render(<AgendarPageContent />);
    expect(screen.getByTestId("agendar-class-panel")).toHaveTextContent(/private class form/i);
    expect(screen.queryByTestId("agendar-event-panel")).not.toBeInTheDocument();
  });

  it("changes mode from the tabs", async () => {
    const user = userEvent.setup();
    render(<AgendarPageContent />);
    await user.click(screen.getByTestId("agendar-tab-class"));
    expect(setBookMode).toHaveBeenCalledWith("class");
  });
});
