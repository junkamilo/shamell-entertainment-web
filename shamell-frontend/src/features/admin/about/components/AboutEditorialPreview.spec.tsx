/** @vitest-environment jsdom */

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import { makeAdminAboutRow } from "../test/fixtures/about.fixture";
import { AboutEditorialPreview } from "./AboutEditorialPreview";

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

function renderPreview(
  overrides: Partial<React.ComponentProps<typeof AboutEditorialPreview>> = {},
) {
  const props: React.ComponentProps<typeof AboutEditorialPreview> = {
    record: makeAdminAboutRow(),
    coreValuesList: ["Professionalism", "Excellence"],
    onEdit: vi.fn(),
    onOpenLightbox: vi.fn(),
    ...overrides,
  };
  return { ...renderWithProviders(<AboutEditorialPreview {...props} />), props };
}

describe("AboutEditorialPreview", () => {
  it("renders title, excerpt, and core values", () => {
    renderPreview();
    expect(screen.getByRole("heading", { name: /about shamell/i })).toBeInTheDocument();
    expect(screen.getByText(/performance artistry/i)).toBeInTheDocument();
    expect(screen.getByText("Professionalism")).toBeInTheDocument();
    expect(screen.getByText("Excellence")).toBeInTheDocument();
  });

  it("calls onEdit from Edit block", async () => {
    const user = userEvent.setup();
    const { props } = renderPreview();
    await user.click(screen.getByRole("button", { name: /edit block/i }));
    expect(props.onEdit).toHaveBeenCalledOnce();
  });

  it("opens lightbox for an image hero", async () => {
    const user = userEvent.setup();
    const { props } = renderPreview();
    await user.click(screen.getByRole("button", { name: /view enlarged photo/i }));
    expect(props.onOpenLightbox).toHaveBeenCalledWith("https://cdn.test/hero.jpg", false);
  });

  it("opens lightbox for a video hero", async () => {
    const user = userEvent.setup();
    const { props } = renderPreview({
      record: makeAdminAboutRow({
        imageUrl: "https://cdn.test/hero.mp4",
        heroMediaType: "VIDEO",
      }),
    });
    await user.click(screen.getByRole("button", { name: /open full view/i }));
    expect(props.onOpenLightbox).toHaveBeenCalledWith("https://cdn.test/hero.mp4", true);
  });

  it("shows empty media placeholder when there is no hero url", () => {
    renderPreview({ record: makeAdminAboutRow({ imageUrl: null }) });
    expect(screen.getByText(/no photo or video/i)).toBeInTheDocument();
  });
});
