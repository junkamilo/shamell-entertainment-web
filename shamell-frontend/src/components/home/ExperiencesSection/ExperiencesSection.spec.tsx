/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import type { Experience } from "@/lib/services/experiencesData";

const experiencesState = {
  experiences: [] as Experience[],
  isLoading: false,
};

vi.mock("@/components/shared", () => ({
  RevealOnView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  CatalogCardCarousel: ({
    children,
    ariaLabel,
  }: {
    children: React.ReactNode;
    ariaLabel?: string;
  }) => <div aria-label={ariaLabel}>{children}</div>,
}));

vi.mock("@/hooks/use-in-view-load", () => ({
  useInViewLoad: () => ({ ref: vi.fn(), inView: true }),
}));

vi.mock("@/hooks/use-experiences", () => ({
  useExperiences: () => ({
    experiences: experiencesState.experiences,
    isLoading: experiencesState.isLoading,
  }),
}));

vi.mock("@/components/experiences", () => ({
  ExperienceCard: ({ experience }: { experience: Experience }) => (
    <div data-testid={`experience-${experience.id}`}>{experience.title}</div>
  ),
}));

import ExperiencesSection from "./ExperiencesSection";

describe("ExperiencesSection", () => {
  afterEach(() => {
    cleanup();
    experiencesState.experiences = [];
    experiencesState.isLoading = false;
  });

  it("shows loading copy while catalog loads", () => {
    experiencesState.isLoading = true;
    const { container } = render(<ExperiencesSection />);

    expect(container.querySelector("#services")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "SERVICE CATALOG" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Loading service catalog...")).toBeInTheDocument();
  });

  it("renders experience cards when loaded", () => {
    experiencesState.isLoading = false;
    experiencesState.experiences = [
      {
        id: "exp-1",
        title: "Fire Performance",
        slug: "fire-performance",
        description: "Hot set",
        items: ["Fire"],
        image: "https://cdn.example.com/fire.jpg",
        heroMediaType: "IMAGE",
        contactInquiryCode: "SHOW",
      },
    ];

    render(<ExperiencesSection />);

    expect(screen.queryByText("Loading service catalog...")).toBeNull();
    expect(screen.getByTestId("experience-exp-1")).toHaveTextContent(
      "Fire Performance",
    );
    expect(
      screen.getByLabelText("Service catalog"),
    ).toBeInTheDocument();
  });
});
