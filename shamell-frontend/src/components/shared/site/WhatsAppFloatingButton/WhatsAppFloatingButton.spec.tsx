/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pathnameRef = vi.hoisted(() => ({ current: "/" as string | null }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameRef.current,
}));

import { WhatsAppFloatingButton } from "./WhatsAppFloatingButton";

describe("WhatsAppFloatingButton", () => {
  beforeEach(() => {
    pathnameRef.current = "/";
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_PHONE", "");
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_PHONE_DISPLAY", "");
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_MESSAGE", "");
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns null on admin routes", () => {
    pathnameRef.current = "/admin/dashboard";
    const { container } = render(<WhatsAppFloatingButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("returns null on payment routes", () => {
    pathnameRef.current = "/pay/quote/return";
    const { container } = render(<WhatsAppFloatingButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opens chat, disables send without message, then sends with text", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<WhatsAppFloatingButton />);
    await user.click(screen.getByRole("button", { name: "Open WhatsApp chat" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    await user.type(screen.getByLabelText("Your message"), "Hello Shamell");
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("https://wa.me/12394521062"),
      "_blank",
      "noopener,noreferrer",
    );
    expect(String(openSpy.mock.calls[0]?.[0])).toContain("Hello");
    expect(String(openSpy.mock.calls[0]?.[0])).toContain("Shamell");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes via cancel and close button", async () => {
    const user = userEvent.setup();
    render(<WhatsAppFloatingButton />);
    await user.click(screen.getByRole("button", { name: "Open WhatsApp chat" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Open WhatsApp chat" }));
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("uses env phone display and default message", async () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_PHONE", "+1 (555) 123-4567");
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_PHONE_DISPLAY", "Custom Display");
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_MESSAGE", "Default hi");
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<WhatsAppFloatingButton />);
    await user.click(screen.getByRole("button", { name: "Open WhatsApp chat" }));
    expect(screen.getByText("Custom Display")).toBeInTheDocument();
    expect(screen.getByLabelText("Your message")).toHaveValue("Default hi");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining("wa.me/15551234567"),
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("falls back phone when env digits are too short", async () => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_PHONE", "123");
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<WhatsAppFloatingButton />);
    await user.click(screen.getByRole("button", { name: "Open WhatsApp chat" }));
    await user.type(screen.getByLabelText("Your message"), "Hi");
    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(openSpy.mock.calls[0]?.[0]).toContain("wa.me/12394521062");
  });

  it("falls back pathname to / when null", () => {
    pathnameRef.current = null;
    render(<WhatsAppFloatingButton />);
    expect(
      screen.getByRole("button", { name: "Open WhatsApp chat" }),
    ).toBeInTheDocument();
  });

  it("uses fallbacks when WhatsApp env vars are unset", async () => {
    vi.unstubAllEnvs();
    delete process.env.NEXT_PUBLIC_WHATSAPP_PHONE;
    delete process.env.NEXT_PUBLIC_WHATSAPP_PHONE_DISPLAY;
    delete process.env.NEXT_PUBLIC_WHATSAPP_MESSAGE;
    const user = userEvent.setup();
    render(<WhatsAppFloatingButton />);
    await user.click(screen.getByRole("button", { name: "Open WhatsApp chat" }));
    expect(screen.getByText("+1 (239) 452-1062")).toBeInTheDocument();
    expect(screen.getByLabelText("Your message")).toHaveValue("");
  });
});
