/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

const routerReplace = vi.hoisted(() => vi.fn());
const submitConciergeInquiry = vi.hoisted(() => vi.fn());
const startEmailVerification = vi.hoisted(() => vi.fn());
const verifyEmailCode = vi.hoisted(() => vi.fn());
const resendEmailVerification = vi.hoisted(() => vi.fn());

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
  ShamellBusyOverlay: ({ active, title }: { active: boolean; title: string }) =>
    active ? <div>{title}</div> : null,
  EmailVerificationModal: ({
    open,
    email,
    onVerify,
    onResend,
    onClose,
    error,
  }: {
    open: boolean;
    email: string;
    onVerify: (code: string) => void;
    onResend: () => void;
    onClose: () => void;
    error?: string | null;
  }) =>
    open ? (
      <div role="dialog">
        <p>Enter the code we just sent to {email}.</p>
        {error ? <p role="alert">{error}</p> : null}
        <button type="button" onClick={() => onVerify("482193")}>
          Verify
        </button>
        <button type="button" onClick={onResend}>
          Resend code
        </button>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

vi.mock("@/lib/email-verification/startEmailVerification", () => ({
  startEmailVerification,
}));

vi.mock("@/lib/email-verification/verifyEmailCode", () => ({
  verifyEmailCode,
}));

vi.mock("@/lib/email-verification/resendEmailVerification", () => ({
  resendEmailVerification,
}));

vi.mock("../services/submitConciergeInquiry", () => ({
  submitConciergeInquiry,
}));

vi.mock("./RecaptchaCheckbox", () => ({
  default: ({
    onToken,
    enabled = true,
  }: {
    onToken: (token: string | null) => void;
    enabled?: boolean;
  }) => (
    <button
      type="button"
      disabled={!enabled}
      onClick={() => onToken("test-recaptcha-token-ok-xx")}
    >
      mock-recaptcha
    </button>
  ),
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

function fillField(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  fillField(/full name/i, "Ada Lovelace");
  fillField(/^email/i, "ada@example.com");
  fillField(/^phone/i, "+15551234567");
  fillField(/city or event location/i, "Miami");
  fillField(/approximate guests/i, "12");
  fillField(
    /tell us what you have in mind/i,
    "We are planning a private celebration in Miami.",
  );
  await user.click(screen.getByRole("button", { name: /select date/i }));
  await user.click(screen.getByRole("button", { name: /pick-date/i }));
  await user.click(screen.getByRole("button", { name: /where are you in planning/i }));
  await user.click(screen.getByRole("option", { name: /i have an idea/i }));
}

describe("ConciergeInquiryForm", () => {
  beforeEach(() => {
    submitConciergeInquiry.mockReset();
    routerReplace.mockReset();
    startEmailVerification.mockReset();
    verifyEmailCode.mockReset();
    resendEmailVerification.mockReset();
    startEmailVerification.mockResolvedValue({
      ok: true,
      challengeId: "ch-1",
      emailMasked: "a***@example.com",
      expiresAt: "2026-09-10T18:10:00.000Z",
    });
    verifyEmailCode.mockResolvedValue({
      ok: true,
      verifiedToken: "a".repeat(40),
    });
  });
  it("renders concierge inquiry heading", () => {
    renderWithProviders(<ConciergeInquiryForm />);
    expect(
      screen.getByRole("heading", { name: /tell us your vision/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^back$/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /send concierge inquiry/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mock-recaptcha/i })).toBeDisabled();
    expect(screen.getByText("(optional)")).toBeInTheDocument();
  });

  it("unlocks recaptcha after required fields are valid", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConciergeInquiryForm />);
    expect(screen.getByRole("button", { name: /mock-recaptcha/i })).toBeDisabled();
    await fillRequiredFields(user);
    expect(screen.getByRole("button", { name: /mock-recaptcha/i })).toBeEnabled();
  });

  it("keeps recaptcha locked until phone, location, date, guests, and planning are filled", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConciergeInquiryForm />);
    fillField(/full name/i, "Ada Lovelace");
    fillField(/^email/i, "ada@example.com");
    fillField(
      /tell us what you have in mind/i,
      "We are planning a private celebration in Miami.",
    );
    expect(screen.getByRole("button", { name: /mock-recaptcha/i })).toBeDisabled();
    fillField(/^phone/i, "+15551234567");
    fillField(/city or event location/i, "Miami");
    fillField(/approximate guests/i, "12");
    await user.click(screen.getByRole("button", { name: /select date/i }));
    await user.click(screen.getByRole("button", { name: /pick-date/i }));
    expect(screen.getByRole("button", { name: /mock-recaptcha/i })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /where are you in planning/i }));
    await user.click(screen.getByRole("option", { name: /i have an idea/i }));
    expect(screen.getByRole("button", { name: /mock-recaptcha/i })).toBeEnabled();
  });

  it("locks recaptcha again if a required field is cleared", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConciergeInquiryForm />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /mock-recaptcha/i }));
    expect(screen.getByRole("button", { name: /send concierge inquiry/i })).toBeInTheDocument();
    fillField(/full name/i, "A");
    expect(screen.getByRole("button", { name: /mock-recaptcha/i })).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /send concierge inquiry/i }),
    ).not.toBeInTheDocument();
  });

  it("validates required fields on submit", () => {
    const { container } = renderWithProviders(<ConciergeInquiryForm />);
    fillField(/full name/i, "A");
    fillField(/^email/i, "ada@example.com");
    fillField(/tell us what you have in mind/i, "Too short");
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
    const user = userEvent.setup();
    const { container } = renderWithProviders(<ConciergeInquiryForm />);
    await fillRequiredFields(user);
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
    fillField(/full name/i, "Ada Lovelace");
    fillField(/^email/i, "ada@example.com");
    fillField(/^phone/i, "+15551234567");
    fillField(/city or event location/i, "Miami");
    fillField(/approximate guests/i, "12");
    fireEvent.change(screen.getByLabelText(/tell us what you have in mind/i), {
      target: { value: "x".repeat(1005) },
    });
    await user.click(screen.getByRole("button", { name: /select date/i }));
    await user.click(screen.getByRole("button", { name: /pick-date/i }));
    const trigger = screen.getByRole("button", { name: /where are you in planning/i });
    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: /i have an idea/i }));
    await user.click(screen.getByRole("button", { name: /mock-recaptcha/i }));
    await user.click(screen.getByRole("button", { name: /send concierge inquiry/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(submitConciergeInquiry).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /^verify$/i }));
    expect(await screen.findByRole("button", { name: "accept-feedback" })).toBeInTheDocument();
  });

  it("submits concierge inquiry when form is valid", async () => {
    const user = userEvent.setup();
    submitConciergeInquiry.mockResolvedValue({ ok: true });
    const { container } = renderWithProviders(<ConciergeInquiryForm />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /mock-recaptcha/i }));
    fireEvent.submit(container.querySelector("form")!);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(startEmailVerification).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /^verify$/i }));

    await waitFor(() =>
      expect(submitConciergeInquiry).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: "Ada Lovelace",
          email: "ada@example.com",
          phone: "+15551234567",
          location: "Miami",
          eventDate: "2030-08-01",
          emailVerificationToken: "a".repeat(40),
          inquiryDetails: expect.objectContaining({
            entrySource: "concierge_gate",
            planningStage: "EARLY_IDEA",
            guestCount: 12,
          }),
        }),
      ),
    );
    await user.click(screen.getByRole("button", { name: "accept-feedback" }));
    expect(routerReplace).toHaveBeenCalledWith("/");
  });

  it("rejects invalid email and guest count", async () => {
    const user = userEvent.setup();
    const { container } = renderWithProviders(<ConciergeInquiryForm />);
    fillField(/full name/i, "Ada Lovelace");
    fillField(/^email/i, "not-an-email");
    fillField(/^phone/i, "+15551234567");
    fillField(/city or event location/i, "Miami");
    fillField(/approximate guests/i, "0");
    fillField(
      /tell us what you have in mind/i,
      "We are planning a private celebration in Miami.",
    );
    await user.click(screen.getByRole("button", { name: /select date/i }));
    await user.click(screen.getByRole("button", { name: /pick-date/i }));
    await user.click(screen.getByRole("button", { name: /where are you in planning/i }));
    await user.click(screen.getByRole("option", { name: /i have an idea/i }));
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
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /mock-recaptcha/i }));
    await user.click(screen.getByRole("button", { name: /send concierge inquiry/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^verify$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nope");

    submitConciergeInquiry.mockRejectedValue(new Error("offline"));
    await user.click(screen.getByRole("button", { name: /^verify$/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/cannot reach the server/i);
  });

  it("opens the verification modal without creating the inquiry", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ConciergeInquiryForm />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /mock-recaptcha/i }));
    await user.click(screen.getByRole("button", { name: /send concierge inquiry/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(
      screen.getByText(/enter the code we just sent to ada@example.com/i),
    ).toBeInTheDocument();
    expect(submitConciergeInquiry).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /^close$/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(submitConciergeInquiry).not.toHaveBeenCalled();
  });

  it("shows an error if sending the code fails", async () => {
    const user = userEvent.setup();
    startEmailVerification.mockResolvedValue({
      ok: false,
      message: "Could not send the verification code.",
    });
    renderWithProviders(<ConciergeInquiryForm />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /mock-recaptcha/i }));
    await user.click(screen.getByRole("button", { name: /send concierge inquiry/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /could not send the verification code/i,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(submitConciergeInquiry).not.toHaveBeenCalled();
  });
});
