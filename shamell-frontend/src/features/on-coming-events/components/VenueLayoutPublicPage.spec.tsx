/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { FIXTURE_EVENT_SLUG } from "../test/fixtures/uuids.fixture";
import {
  makeFloorLayoutApiPayload,
  makeOnComingEventDetail,
  makeStandaloneChairsApiPayload,
  makeVenueAvailability,
  makeVenueTableApiRow,
} from "../test/fixtures/onComingEvents.fixture";
import { clearVenueLayoutPageCache } from "../lib/venueLayoutPageCache";
import { renderWithProviders } from "../test/utils/renderWithProviders";

vi.mock("motion/react", () => {
  const MOTION_PROP_KEYS = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "whileTap",
    "whileHover",
    "whileFocus",
    "whileDrag",
    "whileInView",
    "viewport",
    "layout",
    "layoutId",
    "drag",
    "dragConstraints",
    "dragElastic",
    "dragMomentum",
    "onAnimationStart",
    "onAnimationComplete",
    "onUpdate",
    "onDrag",
    "onDragStart",
    "onDragEnd",
  ]);

  function stripMotionProps(props: Record<string, unknown>) {
    const rest: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (MOTION_PROP_KEYS.has(key)) continue;
      rest[key] = value;
    }
    return rest;
  }

  type MotionElProps = Record<string, unknown> & { children?: React.ReactNode };

  const motion = new Proxy(
    {},
    {
      get: (_target, tag: string) => {
        return ({ children, ...props }: MotionElProps) => {
          const domProps = stripMotionProps(props);
          return <div data-motion={tag} {...domProps}>{children}</div>;
        };
      },
    },
  );

  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion,
    useInView: () => true,
    useMotionValue: (v: unknown) => ({ get: () => v, set: () => {} }),
    animate: () => ({ stop: () => {} }),
  };
});

vi.mock("next/link", () => ({
  default: (props: {
    href: string;
    children: React.ReactNode;
    prefetch?: boolean;
    [key: string]: unknown;
  }) => {
    const { href, children, ...rest } = props;
    const domProps: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (key === "prefetch") continue;
      domProps[key] = value;
    }
    return (
      <a href={href} {...domProps}>
        {children}
      </a>
    );
  },
}));

vi.mock("next/dynamic", () => ({
  default: () =>
    function MockVenueScene3D() {
      return <div data-testid="venue-scene-3d">Venue scene</div>;
    },
}));

vi.mock("@/components/shared/site/Footer", () => ({
  default: () => <footer data-testid="site-footer" />,
  Footer: () => <footer data-testid="site-footer" />,
}));

vi.mock("@/components/venue-3d", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/venue-3d")>();
  return {
    ...actual,
    useVenueSceneLayout: () => ({
      bucket: "phone",
      perfProfile: "mobile",
      viewportHeight: 480,
      viewportMinHeight: 280,
      isCoarsePointer: false,
      isPhone: true,
      isTablet: false,
      isLaptop: false,
      isTv: false,
      dpr: 1,
      chromeCss: "14rem",
    }),
  };
});

vi.mock("@/hooks/use-has-mounted", () => ({
  useHasMounted: () => true,
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

import VenueLayoutPublicPage from "./VenueLayoutPublicPage";

type FetchCounts = {
  venue: number;
  floorLayout: number;
  venueTables: number;
  standaloneChairs: number;
  availability: number;
  eventDetail: number;
};

function emptyCounts(): FetchCounts {
  return {
    venue: 0,
    floorLayout: 0,
    venueTables: 0,
    standaloneChairs: 0,
    availability: 0,
    eventDetail: 0,
  };
}

describe("VenueLayoutPublicPage", () => {
  let counts: FetchCounts;

  beforeEach(() => {
    clearVenueLayoutPageCache();
    counts = emptyCounts();
    server.use(
      http.get("*/api/v1/upcoming-events/:slug/venue", ({ params }) => {
        counts.venue += 1;
        return HttpResponse.json({
          event: {
            eventTypeName: "Saturday Gala",
            description: "Venue seating night.",
            items: ["Tables"],
          },
          config: {
            reservationEventLabel: "Saturday Gala",
            reservationEventDate: "2030-08-01",
            reservationOpensAt: "2030-07-01T12:00:00.000Z",
          },
          slug: String(params.slug ?? FIXTURE_EVENT_SLUG),
        });
      }),
      http.get("*/api/v1/floor-layout", () => {
        counts.floorLayout += 1;
        return HttpResponse.json(makeFloorLayoutApiPayload());
      }),
      http.get("*/api/v1/venue-tables", () => {
        counts.venueTables += 1;
        return HttpResponse.json([makeVenueTableApiRow()]);
      }),
      http.get("*/api/v1/standalone-chairs", () => {
        counts.standaloneChairs += 1;
        return HttpResponse.json(makeStandaloneChairsApiPayload());
      }),
      http.get("*/api/v1/venue-reservations/availability", () => {
        counts.availability += 1;
        return HttpResponse.json(makeVenueAvailability());
      }),
      http.get("*/api/v1/upcoming-events/:slug", ({ params }) => {
        counts.eventDetail += 1;
        return HttpResponse.json(
          makeOnComingEventDetail({
            slug: String(params.slug ?? FIXTURE_EVENT_SLUG),
            purchaseMode: "venue_seating",
          }),
        );
      }),
    );
  });

  it("loads floor plan and renders 3D scene stub", async () => {
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
  });

  it("fetches venue layout data only once on mount", async () => {
    const { rerender } = renderWithProviders(
      <VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(counts.venue).toBe(1);
      expect(counts.floorLayout).toBe(1);
      expect(counts.venueTables).toBe(1);
      expect(counts.standaloneChairs).toBe(1);
      expect(counts.availability).toBe(1);
      expect(counts.eventDetail).toBe(1);
    });

    const afterLoad = { ...counts };

    rerender(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);

    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });

    // Allow any accidental re-fetch loop a beat to fire.
    await new Promise((resolve) => setTimeout(resolve, 150));

    expect(counts).toEqual(afterLoad);
  });
});
