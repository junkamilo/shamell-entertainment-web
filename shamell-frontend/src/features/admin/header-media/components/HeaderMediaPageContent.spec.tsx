/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockHeaderMediaPageState } from "../test/helpers/mockHeaderMediaPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { makeHeaderPhoto } from "../test/fixtures/headerMedia.fixture";

const openPreviewMock = vi.fn();
const openEditModalMock = vi.fn();
const mediaPreviewState = {
  isPreviewOpen: false,
  preview: null as { src: string; title?: string; mediaType?: string } | null,
  openPreview: openPreviewMock,
  closePreview: vi.fn(),
};

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
  useMediaPreview: () => mediaPreviewState,
  MediaPreviewModal: ({
    isOpen,
    src,
    onClose,
  }: {
    isOpen: boolean;
    src: string;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid="media-preview">
        <span>{src}</span>
        <button type="button" onClick={onClose}>
          close-preview
        </button>
      </div>
    ) : null,
}));

vi.mock("@/components/admin/overlays", () => ({
  ConfirmDeleteModal: ({
    isOpen,
    children,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean;
    children: React.ReactNode;
    onClose: () => void;
    onConfirm: () => void;
  }) =>
    isOpen ? (
      <div data-testid="delete-modal">
        {children}
        <button type="button" onClick={onClose}>
          close-delete
        </button>
        <button type="button" onClick={onConfirm}>
          confirm-delete
        </button>
      </div>
    ) : null,
}));

vi.mock("../hooks/useHeaderTextSection", () => ({
  useHeaderTextSection: () => ({
    openEditModal: openEditModalMock,
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
      <button type="button" onClick={() => onTabChange("media")}>
        Go media
      </button>
    </div>
  ),
}));

vi.mock("./HeaderMediaUploadZone", () => ({
  default: () => <div data-testid="upload-zone" />,
}));

vi.mock("./HeaderMediaLibrarySection", () => ({
  default: ({
    onView,
    onFocus,
    onToggle,
    onDelete,
    photos,
  }: {
    onView: (photo: unknown, index: number) => void;
    onFocus: (photo: unknown) => void;
    onToggle: (photo: unknown) => void;
    onDelete: (photo: unknown) => void;
    photos: unknown[];
  }) => (
    <div data-testid="library-section">
      <button type="button" onClick={() => onView(photos[0], 1)}>
        stub-view
      </button>
      <button type="button" onClick={() => onFocus(photos[0])}>
        stub-focus
      </button>
      <button type="button" onClick={() => onToggle(photos[0])}>
        stub-toggle
      </button>
      <button type="button" onClick={() => onDelete(photos[0])}>
        stub-delete
      </button>
    </div>
  ),
}));

vi.mock("./HeaderMediaPendingQueue", () => ({
  default: ({
    onSubmit,
    onPickFiles,
    onClearPending,
    onRemovePendingOne,
  }: {
    onSubmit: (event: { preventDefault: () => void }) => void;
    onPickFiles: () => void;
    onClearPending: () => void;
    onRemovePendingOne: (file: File) => void;
  }) => (
    <div data-testid="pending-queue">
      <button type="button" onClick={() => onSubmit({ preventDefault: vi.fn() })}>
        stub-submit
      </button>
      <button type="button" onClick={onPickFiles}>
        stub-pick
      </button>
      <button type="button" onClick={onClearPending}>
        stub-clear
      </button>
      <button
        type="button"
        onClick={() => onRemovePendingOne(new File(["x"], "a.jpg"))}
      >
        stub-remove-one
      </button>
    </div>
  ),
}));

vi.mock("./HeaderMediaFocusEditor", () => ({
  default: ({
    editingFocusPhoto,
    onClose,
    onSave,
    onSetDraftFromPoint,
  }: {
    editingFocusPhoto: unknown;
    onClose: () => void;
    onSave: () => void;
    onSetDraftFromPoint: (x: number, y: number) => void;
  }) =>
    editingFocusPhoto ? (
      <div data-testid="focus-editor">
        <button type="button" onClick={onClose}>
          close-focus
        </button>
        <button type="button" onClick={onSave}>
          save-focus
        </button>
        <button type="button" onClick={() => onSetDraftFromPoint(10, 20)}>
          set-draft
        </button>
      </div>
    ) : null,
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
    openPreviewMock.mockClear();
    openEditModalMock.mockClear();
    mediaPreviewState.isPreviewOpen = false;
    mediaPreviewState.preview = null;
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

  it("wires library view, focus, toggle, and delete", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeaderMediaPageContent state={state as never} />);
    await user.click(screen.getByRole("button", { name: "stub-view" }));
    expect(openPreviewMock).toHaveBeenCalledWith(
      expect.objectContaining({
        src: state.library.photos[0]!.imageUrl,
        title: "Header media #1",
        mediaType: "IMAGE",
      }),
    );
    await user.click(screen.getByRole("button", { name: "stub-focus" }));
    expect(state.focus.openFocusEditor).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "stub-toggle" }));
    expect(state.onToggle).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "stub-delete" }));
    expect(state.openDeleteConfirm).toHaveBeenCalled();
  });

  it("opens preview as video when the library item is a video", async () => {
    const user = userEvent.setup();
    const video = makeHeaderPhoto({
      imageUrl: "https://cdn.example.com/header/video.mp4",
      mediaType: "VIDEO",
    });
    state = createMockHeaderMediaPageState({
      library: { photos: [video], pagedPhotos: [video] },
    });
    renderWithProviders(<HeaderMediaPageContent state={state as never} />);
    await user.click(screen.getByRole("button", { name: "stub-view" }));
    expect(openPreviewMock).toHaveBeenCalledWith(
      expect.objectContaining({ mediaType: "VIDEO" }),
    );
  });

  it("shows pending queue when files are pending", async () => {
    const user = userEvent.setup();
    state = createMockHeaderMediaPageState({
      upload: {
        pendingFiles: [new File(["x"], "a.jpg", { type: "image/jpeg" })],
      },
    });
    renderWithProviders(<HeaderMediaPageContent state={state as never} />);
    expect(screen.getByTestId("pending-queue")).toBeInTheDocument();
    expect(screen.getByTestId("divider")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "stub-submit" }));
    expect(state.onSubmit).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "stub-pick" }));
    expect(state.upload.onPickFiles).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "stub-clear" }));
    expect(state.upload.clearPending).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "stub-remove-one" }));
    expect(state.upload.removePendingOne).toHaveBeenCalled();
  });

  it("shows delete modal for an image and confirms", async () => {
    const user = userEvent.setup();
    state = createMockHeaderMediaPageState({
      pendingDelete: createMockHeaderMediaPageState().library.photos[0],
    });
    renderWithProviders(<HeaderMediaPageContent state={state as never} />);
    expect(screen.getByTestId("delete-modal")).toBeInTheDocument();
    expect(screen.getByText(/this image/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "confirm-delete" }));
    expect(state.onConfirmDelete).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "close-delete" }));
    expect(state.closeDeleteModal).toHaveBeenCalled();
  });

  it("labels a video in the delete modal", () => {
    const video = makeHeaderPhoto({
      imageUrl: "https://cdn.example.com/header/video.mp4",
      mediaType: "VIDEO",
    });
    state = createMockHeaderMediaPageState({ pendingDelete: video });
    renderWithProviders(<HeaderMediaPageContent state={state as never} />);
    expect(screen.getByText(/this video/)).toBeInTheDocument();
  });

  it("switches to text section and uses Edit text hero action", async () => {
    const user = userEvent.setup();
    renderWithProviders(<HeaderMediaPageContent state={state as never} />);
    await user.click(screen.getByRole("button", { name: "Go text" }));
    expect(screen.getByTestId("text-section")).toBeInTheDocument();
    expect(screen.queryByTestId("upload-zone")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("stub-hero-action"));
    expect(openEditModalMock).toHaveBeenCalled();
  });

  it("wires the focus editor when a photo is being edited", async () => {
    const user = userEvent.setup();
    state = createMockHeaderMediaPageState({
      focus: { editingFocusPhoto: makeHeaderPhoto() },
    });
    renderWithProviders(<HeaderMediaPageContent state={state as never} />);
    expect(screen.getByTestId("focus-editor")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close-focus" }));
    expect(state.focus.closeFocusEditor).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "save-focus" }));
    expect(state.focus.saveFocusEditor).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "set-draft" }));
    expect(state.focus.setDraftFromPoint).toHaveBeenCalledWith(10, 20);
  });

  it("applies drag-over ring on the media section", () => {
    state = createMockHeaderMediaPageState({
      upload: { dragOver: true },
    });
    const { container } = renderWithProviders(
      <HeaderMediaPageContent state={state as never} />,
    );
    expect(container.querySelector(".ring-2")).toBeTruthy();
  });

  it("forwards dropzone drag events", () => {
    const { container } = renderWithProviders(
      <HeaderMediaPageContent state={state as never} />,
    );
    const section = container.querySelector("section")!;
    fireEvent.dragOver(section);
    fireEvent.dragLeave(section);
    fireEvent.drop(section);
    expect(state.upload.onDropzoneDragOver).toHaveBeenCalled();
    expect(state.upload.onDropzoneDragLeave).toHaveBeenCalled();
    expect(state.upload.onDropzoneDrop).toHaveBeenCalled();
  });

  it("renders media preview when open", async () => {
    const user = userEvent.setup();
    mediaPreviewState.isPreviewOpen = true;
    mediaPreviewState.preview = {
      src: "https://cdn.example.com/p.jpg",
      title: "Header media #1",
      mediaType: "IMAGE",
    };
    renderWithProviders(<HeaderMediaPageContent state={state as never} />);
    expect(screen.getByTestId("media-preview")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close-preview" }));
    expect(mediaPreviewState.closePreview).toHaveBeenCalled();
  });
});
