/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockUseContactInquiryFormReturn } from "../test/helpers/mockContactoPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { makeCatalogSnapshot, makeContactLine, makePublicServiceOption } from "../test/fixtures/contacto.fixture";

const formMock = vi.hoisted(() => ({
  useContactInquiryForm: vi.fn(),
}));

const mediaQuery = vi.hoisted(() => ({ lg: false }));

vi.mock("../hooks/useContactInquiryForm", () => ({
  useContactInquiryForm: formMock.useContactInquiryForm,
}));

vi.mock("next/image", () => ({
  default: ({ alt = "" }: { alt?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} />
  ),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => mediaQuery.lg,
}));

vi.mock("@/components/shared", () => ({
  RevealFromDepth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ShamellBackButton: ({
    href,
    label = "Back",
  }: {
    href?: string;
    label?: string;
  }) => (
    <a href={href} aria-label={label}>
      {label}
    </a>
  ),
}));

vi.mock("./CatalogOfferingDetailModal", () => ({
  default: ({
    primaryAction,
    onClose,
  }: {
    primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
    onClose: () => void;
  }) => (
    <div data-testid="detail-modal">
      {primaryAction ? (
        <button type="button" onClick={primaryAction.onClick} disabled={primaryAction.disabled}>
          {primaryAction.label}
        </button>
      ) : null}
      <button type="button" onClick={onClose}>
        close-detail
      </button>
    </div>
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

vi.mock("./ContactTimePickerModal", () => ({
  default: ({
    isOpen,
    title,
    onConfirm,
    onClose,
  }: {
    isOpen: boolean;
    title: string;
    onConfirm: (hhmm: string) => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid={`time-picker-${title}`}>
        <button type="button" onClick={() => onConfirm("19:00")}>
          pick-time
        </button>
        <button type="button" onClick={onClose}>
          close-time
        </button>
      </div>
    ) : null,
}));

vi.mock("./ContactOccasionPickerModal", () => ({
  default: ({
    isOpen,
    onSelect,
    onClose,
  }: {
    isOpen: boolean;
    onSelect: (id: string) => void;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="occasion-picker">
        <button type="button" onClick={() => onSelect("occ-1")}>
          pick-occasion
        </button>
        <button type="button" onClick={onClose}>
          close-occasion
        </button>
      </div>
    ) : null,
}));

vi.mock("./InquirySubmitFeedbackLayer", () => ({
  default: ({
    phase,
    onAccept,
  }: {
    phase: string;
    onAccept: () => void;
  }) => (
    <div data-testid="feedback">{phase}
      <button type="button" onClick={onAccept}>
        accept-feedback
      </button>
    </div>
  ),
}));

vi.mock("./contact-inquiry/ContactInquiryPhaseService", () => ({
  default: ({ currentPhase }: { currentPhase: string }) =>
    currentPhase === "service" ? <div data-testid="phase-service" /> : null,
}));
vi.mock("./contact-inquiry/ContactInquiryPhaseDetail", () => ({
  default: ({ currentPhase }: { currentPhase: string }) =>
    currentPhase === "detail" ? <div data-testid="phase-detail" /> : null,
}));
vi.mock("./contact-inquiry/ContactInquiryPhaseServiceType", () => ({
  default: ({ currentPhase }: { currentPhase: string }) =>
    currentPhase === "serviceType" ? <div data-testid="phase-serviceType" /> : null,
}));
vi.mock("./contact-inquiry/ContactInquiryPhaseExperiences", () => ({
  default: ({ currentPhase }: { currentPhase: string }) =>
    currentPhase === "experiences" ? <div data-testid="phase-experiences" /> : null,
}));
vi.mock("./contact-inquiry/ContactInquiryPhaseLogistics", () => ({
  default: ({ currentPhase }: { currentPhase: string }) =>
    currentPhase === "logistics" ? <div data-testid="phase-logistics" /> : null,
}));
vi.mock("./contact-inquiry/ContactInquiryPhaseExpectations", () => ({
  default: ({ currentPhase }: { currentPhase: string }) =>
    currentPhase === "expectations" ? <div data-testid="phase-expectations" /> : null,
}));
vi.mock("./contact-inquiry/ContactInquiryPhaseContact", () => ({
  default: ({ currentPhase }: { currentPhase: string }) =>
    currentPhase === "contact" ? <div data-testid="phase-contact" /> : null,
}));
vi.mock("./contact-inquiry/ContactInquiryPhaseReview", () => ({
  default: ({ currentPhase }: { currentPhase: string }) =>
    currentPhase === "review" ? <div data-testid="phase-review" /> : null,
}));

import ContactInquiryForm from "./ContactInquiryForm";

function renderForm(
  overrides: Record<string, unknown> = {},
  props: Record<string, unknown> = {},
) {
  const state = createMockUseContactInquiryFormReturn(overrides);
  formMock.useContactInquiryForm.mockReturnValue(state);
  renderWithProviders(
    <ContactInquiryForm entrySource="contact_page" {...props} />,
  );
  return state;
}

describe("ContactInquiryForm", () => {
  beforeEach(() => {
    mediaQuery.lg = false;
  });

  it("renders booking inquiry header and progress nav", () => {
    renderForm();
    expect(screen.getByRole("heading", { name: /booking/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^back$/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("navigation", { name: "Form progress" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /1\. offering/i })).toBeInTheDocument();
    expect(screen.getByTestId("phase-service")).toBeInTheDocument();
  });

  it("uses catalog home fallbacks", () => {
    renderForm({}, { initialCatalog: { kind: "event", id: "e1" } });
    expect(screen.getByRole("link", { name: /^back$/i })).toHaveAttribute(
      "href",
      "/#experiences",
    );
  });

  it("uses services home fallback", () => {
    renderForm({}, { initialCatalog: { kind: "service", id: "s1" } });
    expect(screen.getByRole("link", { name: /^back$/i })).toHaveAttribute(
      "href",
      "/#services",
    );
  });

  it("uses services fallback from home_service_card", () => {
    formMock.useContactInquiryForm.mockReturnValue(
      createMockUseContactInquiryFormReturn(),
    );
    renderWithProviders(
      <ContactInquiryForm entrySource="home_service_card" />,
    );
    expect(screen.getByRole("link", { name: /^back$/i })).toHaveAttribute(
      "href",
      "/#services",
    );
  });

  it("shows loading state for contact lines", () => {
    renderForm({
      catalog: {
        ...createMockUseContactInquiryFormReturn().catalog,
        linesLoading: true,
        linesError: "Could not load lines",
      },
    });
    expect(screen.getByText(/loading offerings/i)).toBeInTheDocument();
    expect(screen.getByText("Could not load lines")).toBeInTheDocument();
  });

  it("navigates progress, continue, and back", async () => {
    const user = userEvent.setup();
    const state = renderForm({
      wizard: {
        ...createMockUseContactInquiryFormReturn().wizard,
        phaseIndex: 1,
        currentPhase: "detail",
        canContinue: true,
      },
    });
    expect(screen.getByTestId("phase-detail")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /1\. offering/i }));
    expect(state.wizard.goToPhaseIndex).toHaveBeenCalledWith(0);
    fireEvent.click(screen.getByRole("button", { name: /8\. review/i }));
    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(state.wizard.goNext).toHaveBeenCalled();
    await user.click(screen.getAllByRole("button", { name: /^back$/i })[0]!);
    expect(state.wizard.goBack).toHaveBeenCalled();
  });

  it("locks offering nav and back on catalog context", () => {
    renderForm({
      wizard: {
        ...createMockUseContactInquiryFormReturn().wizard,
        phaseIndex: 1,
        currentPhase: "detail",
        offeringStepLocked: true,
        detailPhaseIndex: 1,
      },
    });
    expect(screen.getByRole("button", { name: /1\. offering/i })).toBeDisabled();
    expect(screen.getAllByRole("button", { name: /^back$/i })[0]).toBeDisabled();
  });

  it("shows contact continue label and review submit", async () => {
    const user = userEvent.setup();
    const contact = createMockUseContactInquiryFormReturn({
      wizard: {
        ...createMockUseContactInquiryFormReturn().wizard,
        currentPhase: "contact",
        phaseIndex: 6,
      },
    });
    formMock.useContactInquiryForm.mockReturnValue(contact);
    const { rerender } = renderWithProviders(
      <ContactInquiryForm entrySource="contact_page" />,
    );
    expect(screen.getByTestId("phase-contact")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue to review/i })).toBeInTheDocument();

    const review = createMockUseContactInquiryFormReturn({
      wizard: {
        ...createMockUseContactInquiryFormReturn().wizard,
        currentPhase: "review",
        phaseIndex: 7,
      },
      isSubmitting: true,
      apiError: "Server down",
      wizardExtra: undefined,
    });
    review.wizard = {
      ...review.wizard,
      currentPhase: "review",
      phaseIndex: 7,
      stepError: "Fix fields",
    };
    formMock.useContactInquiryForm.mockReturnValue(review);
    rerender(<ContactInquiryForm entrySource="contact_page" />);
    expect(screen.getByTestId("phase-review")).toBeInTheDocument();
    expect(screen.getByText("Fix fields")).toBeInTheDocument();
    expect(screen.getByText("Server down")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled();
    await user.click(screen.getAllByRole("button", { name: /^back$/i })[0]!);
    expect(review.wizard.goBack).toHaveBeenCalled();
  });

  it("submits from review when idle", async () => {
    const user = userEvent.setup();
    const state = renderForm({
      wizard: {
        ...createMockUseContactInquiryFormReturn().wizard,
        currentPhase: "review",
        phaseIndex: 7,
      },
    });
    await user.click(screen.getByRole("button", { name: /submit inquiry/i }));
    expect(state.onSubmit).toHaveBeenCalled();
    fireEvent.submit(screen.getByRole("button", { name: /submit inquiry/i }).closest("form")!);
  });

  it("shows remaining phases", () => {
    for (const phase of [
      "serviceType",
      "experiences",
      "logistics",
      "expectations",
    ] as const) {
      formMock.useContactInquiryForm.mockReturnValue(
        createMockUseContactInquiryFormReturn({
          wizard: {
            ...createMockUseContactInquiryFormReturn().wizard,
            currentPhase: phase,
            phaseIndex: 2,
          },
        }),
      );
      const { unmount } = renderWithProviders(
        <ContactInquiryForm entrySource="contact_page" />,
      );
      expect(screen.getByTestId(`phase-${phase}`)).toBeInTheDocument();
      unmount();
    }
  });

  it("wires catalog context, pickers, and feedback", async () => {
    const user = userEvent.setup();
    mediaQuery.lg = true;
    const snapshot = makeCatalogSnapshot({ descriptionPreview: "Sparkle" } as never);
    const base = createMockUseContactInquiryFormReturn();
    const line = makeContactLine();
    const option = makePublicServiceOption();
    const state = createMockUseContactInquiryFormReturn({
      wizard: {
        ...base.wizard,
        occasionPickerOpen: true,
      },
      catalog: {
        ...base.catalog,
        catalogSnapshot: snapshot,
        catalogLoading: false,
        catalogFetchError: null,
        catalogDismissed: false,
        detailModal: { kind: "contactLine", line },
      },
      availability: {
        ...base.availability,
        datePickerOpen: true,
        timePickerWhich: "start",
      },
      catalogDetailModalProps: { title: "Line" },
      submitFeedbackPhase: "done",
    });
    formMock.useContactInquiryForm.mockReturnValue(state);
    renderWithProviders(
      <ContactInquiryForm
        entrySource="contact_page"
        initialCatalog={{ kind: "event", id: "e1" }}
      />,
    );
    expect(screen.getByText(/catalog context/i)).toBeInTheDocument();
    expect(screen.getByText("Sparkle")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /remove context/i }));
    expect(state.catalog.dismissCatalogContext).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "pick-occasion" }));
    expect(state.wizard.update).toHaveBeenCalledWith("occasionTypeId", "occ-1");
    await user.click(screen.getByRole("button", { name: "pick-date" }));
    expect(state.wizard.update).toHaveBeenCalledWith("eventDate", "2030-08-01");
    await user.click(screen.getByRole("button", { name: "close-time" }));
    expect(state.availability.setTimePickerWhich).toHaveBeenCalledWith(null);
    await user.click(screen.getByRole("button", { name: "pick-time" }));
    expect(state.wizard.update).toHaveBeenCalledWith("eventTimeStart", "19:00");
    await user.click(screen.getByRole("button", { name: "close-time" }));
    expect(state.availability.setTimePickerWhich).toHaveBeenCalledWith(null);
    expect(screen.getByTestId("detail-modal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close-detail" }));
    expect(state.catalog.setDetailModal).toHaveBeenCalledWith(null);
    await user.click(screen.getByRole("button", { name: "accept-feedback" }));
    expect(state.handleInquirySubmitComplete).toHaveBeenCalled();

    state.catalog.detailModal = { kind: "service", option };
    state.availability.timePickerWhich = "end";
    formMock.useContactInquiryForm.mockReturnValue(state);
  });

  it("shows catalog loading and fetch error", () => {
    const base = createMockUseContactInquiryFormReturn();
    formMock.useContactInquiryForm.mockReturnValue(
      createMockUseContactInquiryFormReturn({
        catalog: {
          ...base.catalog,
          catalogLoading: true,
          catalogSnapshot: null,
        },
      }),
    );
    const { rerender } = renderWithProviders(
      <ContactInquiryForm
        entrySource="contact_page"
        initialCatalog={{ kind: "event", id: "e1" }}
      />,
    );
    expect(screen.getByText(/loading what you selected/i)).toBeInTheDocument();

    formMock.useContactInquiryForm.mockReturnValue(
      createMockUseContactInquiryFormReturn({
        catalog: {
          ...base.catalog,
          catalogLoading: false,
          catalogSnapshot: null,
          catalogFetchError: "Missing catalog",
        },
      }),
    );
    rerender(
      <ContactInquiryForm
        entrySource="contact_page"
        initialCatalog={{ kind: "event", id: "e1" }}
      />,
    );
    expect(screen.getByText("Missing catalog")).toBeInTheDocument();
  });

  it("shows an empty catalog context shell while the snapshot is missing", () => {
    const base = createMockUseContactInquiryFormReturn();
    formMock.useContactInquiryForm.mockReturnValue(
      createMockUseContactInquiryFormReturn({
        catalog: {
          ...base.catalog,
          catalogLoading: false,
          catalogSnapshot: null,
          catalogFetchError: null,
        },
      }),
    );
    renderWithProviders(
      <ContactInquiryForm
        entrySource="contact_page"
        initialCatalog={{ kind: "event", id: "e1" }}
      />,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("toggles a service option from the detail modal", async () => {
    const user = userEvent.setup();
    const option = makePublicServiceOption();
    const base = createMockUseContactInquiryFormReturn();
    const setData = vi.fn((updater: (prev: { serviceOptionIds: string[] }) => unknown) => {
      updater({ serviceOptionIds: [] });
    });
    const state = createMockUseContactInquiryFormReturn({
      wizard: { ...base.wizard, setData },
      catalog: {
        ...base.catalog,
        detailModal: { kind: "service", option },
        serviceTypeOptions: [option],
      },
      catalogDetailModalProps: { title: "Service" },
    });
    formMock.useContactInquiryForm.mockReturnValue(state);
    renderWithProviders(<ContactInquiryForm entrySource="contact_page" />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(setData).toHaveBeenCalled();
    expect(state.catalog.setDetailModal).toHaveBeenCalledWith(null);
  });

  it("covers remaining catalog, picker, and review branches", async () => {
    const user = userEvent.setup();
    const option = makePublicServiceOption();
    const line = makeContactLine();
    const snapshot = makeCatalogSnapshot({
      descriptionPreview: undefined,
      contactInquiryCode: "PRIVATE_GALA",
    } as never);
    const base = createMockUseContactInquiryFormReturn();
    const setData = vi.fn((updater: (prev: { serviceOptionIds: string[] }) => unknown) => {
      updater({ serviceOptionIds: [option.id] });
    });
    const state = createMockUseContactInquiryFormReturn({
      selectedLine: undefined,
      logisticsUsesBespokeDeadlineRule: true,
      wizard: {
        ...base.wizard,
        setData,
        phaseIndex: 0,
        occasionPickerOpen: true,
        data: { ...base.wizard.data, contactLineId: "", serviceOptionIds: [option.id] },
      },
      catalog: {
        ...base.catalog,
        catalogSnapshot: snapshot,
        catalogDismissed: false,
        detailModal: { kind: "contactLine", line },
        serviceTypeOptions: [option],
      },
      availability: {
        ...base.availability,
        datePickerOpen: true,
        timePickerWhich: "end",
      },
      catalogDetailModalProps: { title: "Line" },
    });
    formMock.useContactInquiryForm.mockReturnValue(state);
    const { rerender } = renderWithProviders(
      <ContactInquiryForm
        entrySource="contact_page"
        hadServiceTypeInUrl
        initialCatalog={{ kind: "event", id: "e1" }}
      />,
    );
    expect(screen.queryByText(/inquiry type was suggested/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("date-picker")).toBeInTheDocument();
    expect(screen.getByTestId("time-picker-Performance end")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(state.wizard.selectContactLine).toHaveBeenCalled();

    state.catalog.detailModal = { kind: "service", option };
    formMock.useContactInquiryForm.mockReturnValue(state);
    rerender(
      <ContactInquiryForm
        entrySource="contact_page"
        hadServiceTypeInUrl={false}
        initialCatalog={{ kind: "event", id: "e1" }}
      />,
    );
    expect(screen.getByText(/inquiry type was suggested/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(setData).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "pick-time" }));
    expect(state.wizard.update).toHaveBeenCalledWith("eventTimeEnd", "19:00");
    await user.click(screen.getByRole("button", { name: "close-time" }));
    expect(state.availability.setTimePickerWhich).toHaveBeenCalledWith(null);
    await user.click(screen.getByRole("button", { name: "close-date" }));
    expect(state.availability.setDatePickerOpen).toHaveBeenCalledWith(false);
    await user.click(screen.getByRole("button", { name: "close-occasion" }));
    expect(state.wizard.setOccasionPickerOpen).toHaveBeenCalledWith(false);

    const dismissed = createMockUseContactInquiryFormReturn({
      catalog: { ...base.catalog, catalogDismissed: true, catalogSnapshot: snapshot },
    });
    formMock.useContactInquiryForm.mockReturnValue(dismissed);
    rerender(
      <ContactInquiryForm
        entrySource="contact_page"
        initialCatalog={{ kind: "event", id: "e1" }}
      />,
    );
    expect(screen.queryByText(/catalog context/i)).not.toBeInTheDocument();
  });

  it("omits a primary action for unknown detail modal kinds", () => {
    const base = createMockUseContactInquiryFormReturn();
    formMock.useContactInquiryForm.mockReturnValue(
      createMockUseContactInquiryFormReturn({
        catalog: {
          ...base.catalog,
          detailModal: { kind: "unknown" } as never,
        },
        catalogDetailModalProps: { title: "X" },
      }),
    );
    renderWithProviders(<ContactInquiryForm entrySource="contact_page" />);
    expect(screen.getByTestId("detail-modal")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add" })).not.toBeInTheDocument();
  });
});
