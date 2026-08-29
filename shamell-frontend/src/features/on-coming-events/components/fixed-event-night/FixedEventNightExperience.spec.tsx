/** @vitest-environment jsdom */

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../../test/utils/renderWithProviders";
import type {
  FixedEventActivityPublic,
  FixedEventPackagePublic,
} from "../../services/fetchOnComingEventDetail";

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => false,
}));

vi.mock("@/components/shared", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/shared")>();
  return {
    ...actual,
    RevealOnView: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock("@/components/media", () => ({
  CardMedia: ({ alt }: { alt?: string }) => (
    <div data-testid="card-media">{alt}</div>
  ),
}));

import { FixedEventNightExperience } from "./FixedEventNightExperience";

const activities: FixedEventActivityPublic[] = [
  {
    id: "a1",
    title: "Learn Belly Dance Workshop",
    description: "Learn Arabic dance steps with live percussion.",
    mediaUrl: "https://cdn.example/workshop.jpg",
    mediaType: "IMAGE",
    accentColor: null,
    showText: true,
    displayOrder: 0,
  },
  {
    id: "a2",
    title: "Open Stage for Dancers",
    description: "Non-professional dancers are invited to perform.",
    mediaUrl: null,
    mediaType: null,
    accentColor: "#1a2a6c",
    showText: true,
    displayOrder: 1,
  },
  {
    id: "a3",
    title: "Professional Belly Dance Show",
    description: "Watch a stunning professional show.",
    mediaUrl: null,
    mediaType: null,
    accentColor: null,
    showText: true,
    displayOrder: 2,
  },
];

const packages: FixedEventPackagePublic[] = [
  {
    id: "p1",
    title: "The Full Experience",
    description: null,
    badge: null,
    price: 40,
    priceCents: 4000,
    arrivalLabel: "6:00 PM",
    inclusionSummary: "Workshop + Open Stage + Show",
    activities: activities,
    displayOrder: 0,
    capacity: 50,
    ticketsRemaining: 12,
    ticketsSold: 38,
    soldOut: false,
    isActive: true,
  },
  {
    id: "p2",
    title: "Open Stage Experience",
    description: null,
    badge: null,
    price: 25,
    priceCents: 2500,
    arrivalLabel: "7:15 – 7:30 PM",
    inclusionSummary: "Open Stage + Show",
    activities: [activities[1], activities[2]],
    displayOrder: 1,
    capacity: 40,
    ticketsRemaining: 8,
    ticketsSold: 32,
    soldOut: false,
    isActive: true,
  },
  {
    id: "p3",
    title: "Show Admission",
    description: null,
    badge: null,
    price: 15,
    priceCents: 1500,
    arrivalLabel: "7:45 PM",
    inclusionSummary: "Show only",
    activities: [activities[2]],
    displayOrder: 2,
    capacity: 80,
    ticketsRemaining: 0,
    ticketsSold: 80,
    soldOut: true,
    isActive: true,
  },
];

describe("FixedEventNightExperience", () => {
  it("renders section heading, activities, prices, includes control, and arrival", () => {
    renderWithProviders(
      <FixedEventNightExperience
        activities={activities}
        packages={packages}
        onSelectPackage={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: /activities of the night/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /1\.\s*Learn Belly Dance Workshop/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("$40")).toBeInTheDocument();
    expect(screen.getByText("$25")).toBeInTheDocument();
    expect(screen.getByLabelText(/12 tickets left/i)).toBeInTheDocument();
    expect(screen.getByText("6:00 PM")).toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /includes/i }).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens in-card includes panel when Includes is clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FixedEventNightExperience
        activities={activities}
        packages={packages}
        onSelectPackage={vi.fn()}
      />,
    );

    const includesButtons = screen.getAllByRole("button", {
      name: /includes/i,
    });
    await user.click(includesButtons[0]);

    expect(
      screen.getByRole("dialog", { name: /included in the full experience/i }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Learn Belly Dance Workshop").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText("Open Stage for Dancers").length).toBeGreaterThan(
      0,
    );
  });

  it("hides activity text when showText is false", () => {
    renderWithProviders(
      <FixedEventNightExperience
        activities={[
          {
            ...activities[0],
            showText: false,
            description: "Should not appear on card",
          },
          activities[1],
          activities[2],
        ]}
        packages={packages}
        onSelectPackage={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("heading", {
        name: /1\.\s*Learn Belly Dance Workshop/i,
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Should not appear on card")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /2\.\s*Open Stage for Dancers/i }),
    ).toBeInTheDocument();
  });

  it("calls onSelectPackage when Buy is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(
      <FixedEventNightExperience
        activities={activities}
        packages={packages}
        onSelectPackage={onSelect}
      />,
    );

    const buyButtons = screen.getAllByRole("button", { name: /^buy$/i });
    await user.click(buyButtons[0]);
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: "p1", title: "The Full Experience" }),
    );
  });

  it("disables sold-out package CTA", () => {
    renderWithProviders(
      <FixedEventNightExperience
        activities={activities}
        packages={packages}
        onSelectPackage={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /sold out/i })).toBeDisabled();
  });

  it("renders nothing when empty", () => {
    const { container } = renderWithProviders(
      <FixedEventNightExperience
        activities={[]}
        packages={[]}
        onSelectPackage={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("enables horizontal scroll rows when there are 5 activities and packages", () => {
    const fiveActivities = Array.from({ length: 5 }, (_, i) => ({
      ...activities[i % activities.length],
      id: `a-scroll-${i}`,
      title: `Activity ${i + 1}`,
      displayOrder: i,
    }));
    const fivePackages = Array.from({ length: 5 }, (_, i) => ({
      ...packages[i % packages.length],
      id: `p-scroll-${i}`,
      title: `Package ${i + 1}`,
      displayOrder: i,
      soldOut: false,
    }));

    const { container } = renderWithProviders(
      <FixedEventNightExperience
        activities={fiveActivities}
        packages={fivePackages}
        onSelectPackage={vi.fn()}
      />,
    );

    const scrollRows = container.querySelectorAll('[data-scroll-row="true"]');
    expect(scrollRows.length).toBe(2);
    for (const row of scrollRows) {
      expect(row.className).toContain("overflow-x-auto");
    }
  });

  it("does not enable scroll rows for three items", () => {
    const { container } = renderWithProviders(
      <FixedEventNightExperience
        activities={activities}
        packages={packages}
        onSelectPackage={vi.fn()}
      />,
    );

    expect(container.querySelectorAll('[data-scroll-row="true"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-scroll-row="false"]')).toHaveLength(2);
  });
});
