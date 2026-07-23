/** @vitest-environment jsdom */

import { createRef } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { makeAdminAboutRow } from "../test/fixtures/about.fixture";
import { AboutAdminPage } from "./AboutAdminPage";

const useAdminAboutPageMock = vi.fn();

vi.mock("../hooks/useAdminAboutPage", () => ({
  useAdminAboutPage: () => useAdminAboutPageMock(),
}));

vi.mock("next/image", () => ({
  default: ({
    alt = "",
    src,
  }: {
    alt?: string;
    src: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} />
  ),
}));

function makePage(
  overrides: Record<string, unknown> = {},
) {
  return {
    record: null as ReturnType<typeof makeAdminAboutRow> | null,
    isLoading: false,
    stats: {
      state: "Not published",
      values: "0",
      media: "No",
      updated: "—",
    },
    coreValuesList: [] as string[],
    isModalOpen: false,
    isDeleteHeroConfirmOpen: false,
    openAboutModal: vi.fn(),
    closeAboutModal: vi.fn(),
    openDeleteHeroConfirm: vi.fn(),
    closeDeleteHeroModal: vi.fn(),
    confirmDeleteHero: vi.fn(),
    handleSubmit: vi.fn((event: React.FormEvent) => event.preventDefault()),
    lightboxPortalReady: false,
    isPreviewLightboxOpen: false,
    lightboxDisplay: null,
    openHeroLightbox: vi.fn(),
    closeHeroLightbox: vi.fn(),
    onLightboxExitComplete: vi.fn(),
    title: "ABOUT SHAMELL",
    setTitle: vi.fn(),
    paragraph1: "",
    setParagraph1: vi.fn(),
    coreValuesText: "",
    setCoreValuesText: vi.fn(),
    existingImageUrl: null as string | null,
    existingHeroMediaType: "IMAGE" as const,
    imageFile: null,
    setImageFile: vi.fn(),
    imagePreviewUrl: null as string | null,
    imageFileInputRef: createRef<HTMLInputElement>(),
    isSubmitting: false,
    isDeletingHero: false,
    syncFormFromRecord: vi.fn(),
    resetFormOnClose: vi.fn(),
    discardSelectedFile: vi.fn(),
    deleteSavedHeroMedia: vi.fn(),
    onSubmit: vi.fn(),
    ...overrides,
  };
}

describe("AboutAdminPage", () => {
  beforeEach(() => {
    useAdminAboutPageMock.mockReset();
  });

  it("shows empty state when there is no published record", () => {
    const page = makePage();
    useAdminAboutPageMock.mockReturnValue(page);
    renderWithProviders(<AboutAdminPage />);

    expect(screen.getByText(/no about block yet/i)).toBeInTheDocument();
    expect(screen.getByText("Not published")).toBeInTheDocument();
  });

  it("shows loading hint while fetching", () => {
    useAdminAboutPageMock.mockReturnValue(makePage({ isLoading: true }));
    renderWithProviders(<AboutAdminPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders editorial preview for a published record", () => {
    const record = makeAdminAboutRow({ title: "ABOUT SHAMELL" });
    useAdminAboutPageMock.mockReturnValue(
      makePage({
        record,
        coreValuesList: record.coreValues,
        stats: {
          state: "Published",
          values: "2",
          media: "Photo",
          updated: "Just now",
        },
      }),
    );
    renderWithProviders(<AboutAdminPage />);

    expect(screen.getByRole("heading", { level: 3, name: /about shamell/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit block/i })).toBeInTheDocument();
    expect(screen.queryByText(/no about block yet/i)).not.toBeInTheDocument();
  });

  it("opens the create flow from the hero action", async () => {
    const user = userEvent.setup();
    const page = makePage();
    useAdminAboutPageMock.mockReturnValue(page);
    renderWithProviders(<AboutAdminPage />);

    await user.click(screen.getByRole("button", { name: /\+ create content/i }));
    expect(page.openAboutModal).toHaveBeenCalledOnce();
  });
});
