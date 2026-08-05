/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  makeExperienceFixture,
  makeStaticImageStub,
} from "@/lib/services/test/fixtures/servicesLib.fixture";
import type { Experience } from "@/lib/services/experiencesData";
import { ExperienceCard } from "./ExperienceCard";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ..._rest
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    prefetch?: boolean;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
  }: {
    src: string | { src: string };
    alt: string;
  }) => {
    const resolved = typeof src === "string" ? src : src.src;
    // eslint-disable-next-line @next/next/no-img-element
    return <img data-testid="next-image" src={resolved} alt={alt} />;
  },
}));

vi.mock("@/components/shared", () => ({
  useCatalogSlideActive: () => true,
}));

vi.mock("@/components/media", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/media")>();
  return {
    ...actual,
    CardMedia: ({
      mediaType,
      alt,
      imageUrl,
      videoUrl,
    }: {
      mediaType: string;
      alt: string;
      imageUrl?: string | null;
      videoUrl?: string | null;
    }) => (
      <div
        data-testid="card-media"
        data-media-type={mediaType}
        data-image={imageUrl ?? ""}
        data-video={videoUrl ?? ""}
      >
        {alt}
      </div>
    ),
  };
});

const SERVICE_ID = "22222222-2222-4222-8222-222222222222";

function apiImageExperience(overrides: Partial<Experience> = {}): Experience {
  return makeExperienceFixture({
    id: SERVICE_ID,
    title: "Fire",
    image: "https://cdn.example/services/fire.jpg",
    contactInquiryCode: "PRIVATE_GALA",
    ...overrides,
  });
}

describe("ExperienceCard", () => {
  it("renders title and inquire link with service catalog params", () => {
    render(<ExperienceCard experience={apiImageExperience()} />);
    expect(screen.getByRole("heading", { name: "FIRE" })).toBeInTheDocument();
    const inquire = screen.getByRole("link", { name: /inquire/i });
    expect(inquire).toHaveAttribute("href", expect.stringContaining("serviceType=PRIVATE_GALA"));
    expect(inquire).toHaveAttribute("href", expect.stringContaining("catalogKind=service"));
    expect(inquire).toHaveAttribute(
      "href",
      expect.stringContaining(`catalogId=${SERVICE_ID}`),
    );
  });

  it("toggles DESCRIPTION and ITEMS panels", async () => {
    const user = userEvent.setup();
    render(<ExperienceCard experience={apiImageExperience()} />);

    const descriptionSection = screen.getByRole("heading", { name: "DESCRIPTION" }).parentElement!;
    const itemsSection = screen.getByRole("heading", { name: "ITEMS" }).parentElement!;
    const descriptionToggle = within(descriptionSection).getByRole("button");
    const itemsToggle = within(itemsSection).getByRole("button");

    expect(descriptionToggle).toHaveAttribute("aria-expanded", "false");
    expect(itemsToggle).toHaveAttribute("aria-expanded", "false");

    await user.click(descriptionToggle);
    expect(descriptionToggle).toHaveAttribute("aria-expanded", "true");

    await user.click(itemsToggle);
    expect(itemsToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Venue approval required")).toBeInTheDocument();
  });

  it("renders CardMedia for IMAGE api media", () => {
    render(<ExperienceCard experience={apiImageExperience()} />);
    const media = screen.getByTestId("card-media");
    expect(media).toHaveAttribute("data-media-type", "IMAGE");
    expect(media).toHaveAttribute("data-image", "https://cdn.example/services/fire.jpg");
    expect(screen.queryByTestId("next-image")).not.toBeInTheDocument();
  });

  it("renders CardMedia for VIDEO api media", () => {
    render(
      <ExperienceCard
        experience={apiImageExperience({
          image: "",
          heroMediaType: "VIDEO",
          videoUrl: "https://cdn.example/services/fire.mp4",
          posterUrl: "https://cdn.example/services/poster.jpg",
        })}
      />,
    );
    const media = screen.getByTestId("card-media");
    expect(media).toHaveAttribute("data-media-type", "VIDEO");
    expect(media).toHaveAttribute("data-video", "https://cdn.example/services/fire.mp4");
  });

  it("falls back to next/image when image is StaticImageData", () => {
    render(
      <ExperienceCard
        experience={makeExperienceFixture({
          id: SERVICE_ID,
          image: makeStaticImageStub("/stub-experience.jpg") as Experience["image"],
          videoUrl: null,
          posterUrl: null,
        })}
      />,
    );
    expect(screen.queryByTestId("card-media")).not.toBeInTheDocument();
    expect(screen.getByTestId("next-image")).toHaveAttribute("src", "/stub-experience.jpg");
  });
});
