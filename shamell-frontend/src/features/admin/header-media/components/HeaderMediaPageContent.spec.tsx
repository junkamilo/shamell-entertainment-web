/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockHeaderMediaPageState } from "../test/helpers/mockHeaderMediaPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("@/components/admin/layout", () => ({
  BackButton: () => <a href="/admin">Back</a>,
  ModuleHero: ({
    title,
    actionLabel,
    onAction,
  }: {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
  }) => (
    <div>
      <h1>{title}</h1>
      <button type="button" onClick={onAction} data-testid="stub-hero-action">
        {actionLabel}
      </button>
    </div>
  ),
}));

vi.mock("@/components/admin/media", () => ({
  useMediaPreview: () => ({
    isPreviewOpen: false,
    preview: null,
    openPreview: vi.fn(),
    closePreview: vi.fn(),
  }),
  MediaPreviewModal: () => null,
}));

vi.mock("@/components/admin/overlays", () => ({
  ConfirmDeleteModal: ({
    isOpen,
    children,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
  }) => (isOpen ? <div data-testid="delete-modal">{children}</div> : null),
}));

vi.mock("../hooks/useHeaderTextSection", () => ({
  useHeaderTextSection: () => ({
    openEditModal: vi.fn(),
    previewContent: { headline: "SHAMELL" },
    isLoading: false,
    isModalOpen: false,
    closeEditModal: vi.fn(),
    handleSubmit: vi.fn(),
    form: {},
    record: null,
    reload: vi.fn(),
  }),
}));

vi.mock("./HeaderMediaSectionTabs", () => ({
  default: ({
    activeTab,
    onTabChange,
  }: {
    activeTab: string;
    onTabChange: (tab: "media" | "text") => void;
  }) => (
    <div>
      <span data-testid="active-tab">{activeTab}</span>
      <button type="button" onClick={() => onTabChange("text")}>
        Go text
      </button>
    </div>
  ),
}));

vi.mock("./HeaderMediaUploadZone", () => ({
  default: () => <div data-testid="upload-zone" />,
}));

vi.mock("./HeaderMediaLibrarySection", () => ({
  default: () => <div data-testid="library-section" />,
}));

vi.mock("./HeaderMediaPendingQueue", () => ({
  default: () => <div data-testid="pending-queue" />,
}));

vi.mock("./HeaderMediaFocusEditor", () => ({
  default: ({ editingFocusPhoto }: { editingFocusPhoto: unknown }) =>
    editingFocusPhoto ? <div data-testid="focus-editor" /> : null,
}));

vi.mock("./HeaderTextSection", () => ({
  default: () => <div data-testid="text-section" />,
}));

vi.mock("./SectionGoldDivider", () => ({
  default: () => <div data-testid="divider" />,
}));

import HeaderMediaPageContent from "./HeaderMediaPageContent";

describe("HeaderMediaPageContent", () => {
  let state = createMockHeaderMediaPageState();

  beforeEach(() => {
    state = createMockHeaderMediaPageState();
  });

  it("renders Main header hero and media shells", () => {
    renderWithProviders(<HeaderMediaPageContent state={state as never} />);
    expect(screen.getByRole("heading", { name: "Main header" })).toBeInTheDocument();
    expect(screen.getByTestId("upload-zone")).toBeInTheDocument();
    expect(screen.getByTestId("library-section")).toBeInTheDocument();
  });

  it("calls upload onPickFiles from hero on media tab", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeaderMediaPageContent state={state as never} />);
    await user.click(screen.getByTestId("stub-hero-action"));
    expect(state.upload.onPickFiles).toHaveBeenCalled();
  });

  it("shows pending queue when files are pending", () => {
    state = createMockHeaderMediaPageState({
      upload: {
        pendingFiles: [new File(["x"], "a.jpg", { type: "image/jpeg" })],
      },
    });
    renderWithProviders(<HeaderMediaPageContent state={state as never} />);
    expect(screen.getByTestId("pending-queue")).toBeInTheDocument();
    expect(screen.getByTestId("divider")).toBeInTheDocument();
  });

  it("shows delete modal when pendingDelete is set", () => {
    state = createMockHeaderMediaPageState({
      pendingDelete: createMockHeaderMediaPageState().library.photos[0],
    });
    renderWithProviders(<HeaderMediaPageContent state={state as never} />);
    expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
  });

  it("switches to text section", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeaderMediaPageContent state={state as never} />);
    await user.click(screen.getByRole("button", { name: "Go text" }));
    expect(screen.getByTestId("text-section")).toBeInTheDocument();
    expect(screen.queryByTestId("upload-zone")).not.toBeInTheDocument();
  });
});
