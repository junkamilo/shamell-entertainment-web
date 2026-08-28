/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

const routerReplace = vi.hoisted(() => vi.fn());
const submitConciergeInquiry = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplace,
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("next/image", () => ({
  default: () => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt="" />
  ),
}));

vi.mock("motion/react", () => {
  const MOTION_PROP_KEYS = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "whileTap",
    "whileHover",
    "layout",
  ]);
  function strip(props: Record<string, unknown>) {
    const rest: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (MOTION_PROP_KEYS.has(key)) continue;
      rest[key] = value;
    }
    return rest;
  }
  const motion = new Proxy(
    {},
    {
      get: (_t, tag: string) => {
        return ({
          children,
          ...props
        }: Record<string, unknown> & { children?: React.ReactNode }) => {
          const Tag = tag as keyof JSX.IntrinsicElements;
          return <Tag {...strip(props)}>{children}</Tag>;
        };
      },
    },
  );
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion,
  };
});

vi.mock("@/components/shared", () => ({
  ShamellBackButton: ({ label = "Back" }: { label?: string }) => (
    <button type="button" aria-label={label}>
      {label}
    </button>
  ),
}));

vi.mock("../services/submitConciergeInquiry", () => ({
  submitConciergeInquiry,
}));

vi.mock("./ContactDatePickerModal", () => ({
  default: ({
    isOpen,
    onConfirm,
    onClose,
  }: {
    isOpen: boolean;
    onConfirm: (iso: string) => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="date-picker">
        <button type="button" onClick={() => onConfirm("2030-08-01")}>
          pick-date
        </button>
        <button type="button" onClick={onClose}>
          close-date
        </button>
      </div>
    ) : null,
}));

vi.mock("./InquirySubmitFeedbackLayer", () => ({
  default: ({
    phase,
    onAccept,
  }: {
    phase?: string | null;
    onAccept: () => void;
  }) =>
    phase && phase !== "idle" ? (
      <button type="button" onClick={onAccept}>
        accept-feedback
      </button>
    ) : null,
}));

import ConciergeInquiryForm from "./ConciergeInquiryForm";

describe("ConciergeInquiryForm", () => {
  beforeEach(() => {
    submitConciergeInquiry.mockReset();
    routerReplace.mockReset();
  });
  it("renders concierge inquiry heading", () => {
    renderWithProviders(<ConciergeInquiryForm />);
    expect(
      screen.getByRole("heading", { name: /tell us your vision/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^back$/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /back to inquiry options/i })).not.toBeInTheDocument();
  });

  it("validates required fields on submit", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<ConciergeInquiryForm />);
    await user.type(screen.getByLabelText(/full name/i), "A");
    await user.type(screen.getByLabelText(/^email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/tell us what you have in mind/i), "Too short");
    fireEvent.submit(container.querySelector("form")!);
    expect(screen.getByRole("alert")).toHaveTextContent(/full name|little more/i);
    expect(submitConciergeInquiry).not.toHaveBeenCalled();
  });

  it("closes the planning-stage list on Escape", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConciergeInquiryForm />);
    await user.click(screen.getByRole("button", { name: /where are you in planning/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole("listbox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Enter" });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /where are you in planning/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("shows the empty planning option after a value is chosen", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConciergeInquiryForm />);
    const trigger = screen.getByRole("button", { name: /where are you in planning/i });
    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: /i have an idea/i }));
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /where are you in planning/i }));
    const empty = await screen.findByRole("option", { name: /closest option/i });
    await user.click(empty);
    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("rejects a short vision when the rest of the form is valid", async () => {
    const { container } = renderWithProviders(<ConciergeInquiryForm />);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText(/tell us what you have in mind/i), {
      target: { value: "Too short" },
    });
    fireEvent.submit(container.querySelector("form")!);
    expect(screen.getByRole("alert")).toHaveTextContent(/little more/i);
  });

  it("opens the planning-stage list, picks, closes, and submits a long vision", async () => {
    const user = userEvent.setup();
    submitConciergeInquiry.mockResolvedValue({ ok: true });
    renderWithProviders(<ConciergeInquiryForm />);
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: "Ada Lovelace" } });
    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "ada@example.com" } });
    fireEvent.change(screen.getByLabelText(/approximate guests/i), { target: { value: "12" } });
    fireEvent.change(screen.getByLabelText(/tell us what you have in mind/i), {
      target: { value: "x".repeat(1005) },
    });
    const trigger = screen.getByRole("button", { name: /where are you in planning/i });
    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: /i have an idea/i }));
    let resolveSubmit!: (value: { ok: true }) => void;
    submitConciergeInquiry.mockImplementation(
      () => new Promise((resolve) => {
        resolveSubmit = resolve;
      }),
    );
    await user.click(screen.getByRole("button", { name: /send concierge inquiry/i }));
    expect(await screen.findByText(/sending/i)).toBeInTheDocument();
    resolveSubmit({ ok: true });
    expect(await screen.findByRole("button", { name: "accept-feedback" })).toBeInTheDocument();
  });

  it("submits concierge inquiry when form is valid", async () => {
    submitConciergeInquiry.mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    renderWithProviders(<ConciergeInquiryForm />);

    await user.type(screen.getByLabelText(/full name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/^email/i), "ada@example.com");
    await user.type(screen.getByLabelText(/phone/i), "555");
    await user.type(screen.getByLabelText(/city or event location/i), "Miami");
    await user.type(screen.getByLabelText(/occasion idea/i), "Wedding");
    await user.type(screen.getByLabelText(/approximate guests/i), "40");
    await user.click(screen.getByText("Select date"));
    await user.click(screen.getByRole("button", { name: "close-date" }));
    await user.click(screen.getByText("Select date"));
    await user.click(screen.getByRole("button", { name: "pick-date" }));
    await user.click(screen.getByRole("button", { name: /clear date/i }));
    await user.type(
      screen.getByLabelText(/tell us what you have in mind/i),
      "We are planning a private celebration in Miami.",
    );
    await user.click(screen.getByRole("button", { name: /where are you in planning/i }));
    await user.click(screen.getByRole("option", { name: /i have an idea/i }));
    await user.click(
      screen.getByRole("button", { name: /send concierge inquiry/i }),
    );

    expect(submitConciergeInquiry).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: "Ada Lovelace",
        email: "ada@example.com",
      }),
    );
    await user.click(screen.getByRole("button", { name: "accept-feedback" }));
    expect(routerReplace).toHaveBeenCalledWith("/");
  });

  it("rejects invalid email and guest count", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<ConciergeInquiryForm />);
    await user.type(screen.getByLabelText(/full name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/^email/i), "not-an-email");
    await user.type(screen.getByLabelText(/approximate guests/i), "0");
    await user.type(
      screen.getByLabelText(/tell us what you have in mind/i),
      "We are planning a private celebration in Miami.",
    );
    fireEvent.submit(container.querySelector("form")!);
    expect(screen.getByRole("alert")).toHaveTextContent(/valid email/i);

    fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: "ada@example.com" } });
    fireEvent.submit(container.querySelector("form")!);
    expect(screen.getByRole("alert")).toHaveTextContent(/guest count/i);
  });

  it("shows API and network errors", async () => {
    const user = userEvent.setup();
    submitConciergeInquiry.mockResolvedValue({ ok: false, message: "Nope" });
    renderWithProviders(<ConciergeInquiryForm />);
    await user.type(screen.getByLabelText(/full name/i), "Ada Lovelace");
    await user.type(screen.getByLabelText(/^email/i), "ada@example.com");
    await user.type(
      screen.getByLabelText(/tell us what you have in mind/i),
      "We are planning a private celebration in Miami.",
    );
    await user.click(screen.getByRole("button", { name: /send concierge inquiry/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nope");

    submitConciergeInquiry.mockRejectedValue(new Error("offline"));
    await user.click(screen.getByRole("button", { name: /send concierge inquiry/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/cannot reach the server/i);
  });
});
