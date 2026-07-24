/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DEFAULT_HEADER_TEXT } from "@/lib/headerTextTypes";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/overlays", () => ({
  Modal: ({
    isOpen,
    title,
    children,
    onClose,
  }: {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        {children}
        <button type="button" onClick={onClose}>
          x
        </button>
      </div>
    ) : null,
}));

vi.mock("./HeaderTextPreview", () => ({
  default: () => <div data-testid="live-preview" />,
}));

vi.mock("./HeaderTextStyleField", () => ({
  default: ({ label }: { label: string }) => <div data-testid={`field-${label}`} />,
}));

import HeaderTextEditModal from "./HeaderTextEditModal";

function makeState(overrides: Record<string, unknown> = {}) {
  const form = {
    headline: DEFAULT_HEADER_TEXT.headline,
    setHeadline: vi.fn(),
    headlineFont: DEFAULT_HEADER_TEXT.headlineFont,
    setHeadlineFont: vi.fn(),
    headlineColor: DEFAULT_HEADER_TEXT.headlineColor,
    setHeadlineColor: vi.fn(),
    tagline: DEFAULT_HEADER_TEXT.tagline,
    setTagline: vi.fn(),
    taglineFont: DEFAULT_HEADER_TEXT.taglineFont,
    setTaglineFont: vi.fn(),
    taglineColor: DEFAULT_HEADER_TEXT.taglineColor,
    setTaglineColor: vi.fn(),
    quote: DEFAULT_HEADER_TEXT.quote,
    setQuote: vi.fn(),
    quoteFont: DEFAULT_HEADER_TEXT.quoteFont,
    setQuoteFont: vi.fn(),
    quoteColor: DEFAULT_HEADER_TEXT.quoteColor,
    setQuoteColor: vi.fn(),
    draftContent: DEFAULT_HEADER_TEXT,
    isSubmitting: false,
    ...(overrides.form as Record<string, unknown> | undefined),
  };
  const rest = { ...overrides };
  delete rest.form;
  return {
    form,
    isModalOpen: true,
    closeEditModal: vi.fn(),
    handleSubmit: vi.fn(),
    ...rest,
  };
}

describe("HeaderTextEditModal", () => {
  it("renders fields when open", () => {
    renderWithProviders(<HeaderTextEditModal state={makeState() as never} />);
    expect(screen.getByRole("dialog", { name: "Edit header text" })).toBeInTheDocument();
    expect(screen.getByTestId("field-TITLE")).toBeInTheDocument();
    expect(screen.getByTestId("field-TAGLINE")).toBeInTheDocument();
    expect(screen.getByTestId("field-QUOTE")).toBeInTheDocument();
    expect(screen.getByTestId("live-preview")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    renderWithProviders(
      <HeaderTextEditModal state={makeState({ isModalOpen: false }) as never} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("calls closeEditModal from Cancel", async () => {
    const user = userEvent.setup();
    const state = makeState();
    renderWithProviders(<HeaderTextEditModal state={state as never} />);
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(state.closeEditModal).toHaveBeenCalled();
  });

  it("shows Saving... while submitting", () => {
    renderWithProviders(
      <HeaderTextEditModal
        state={makeState({ form: { isSubmitting: true } }) as never}
      />,
    );
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();
  });
});
