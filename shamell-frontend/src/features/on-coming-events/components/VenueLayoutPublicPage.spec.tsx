/** @vitest-environment jsdom */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  FIXTURE_EVENT_SLUG,
  FIXTURE_LAYOUT_ITEM_ID,
  FIXTURE_TABLE_CONFIG_ID,
} from "../test/fixtures/uuids.fixture";
import {
  makeFloorLayoutApiPayload,
  makeOnComingEventDetail,
  makeStandaloneChairsApiPayload,
  makeVenueAvailability,
  makeVenueTableApiRow,
} from "../test/fixtures/onComingEvents.fixture";
import { clearVenueLayoutPageCache, setVenueLayoutPageCache } from "../lib/venueLayoutPageCache";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import * as chairsService from "../services/fetchPublicStandaloneChairs";
import * as eventDetailService from "../services/fetchOnComingEventDetail";

vi.mock("motion/react", () => {
  const MOTION_PROP_KEYS = new Set([
    "initial",
    "animate",
    "exit",
    "transition",
    "variants",
    "whileTap",
    "whileHover",
    "layout",
  ]);
  function strip(props: Record<string, unknown>) {
    const rest: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(props)) {
      if (MOTION_PROP_KEYS.has(key)) continue;
      rest[key] = value;
    }
    return rest;
  }
  const motion = new Proxy(
    {},
    {
      get: (_t, tag: string) => {
        return ({
          children,
          ...props
        }: Record<string, unknown> & { children?: React.ReactNode }) => {
          const Tag = tag as keyof JSX.IntrinsicElements;
          return <Tag {...strip(props)}>{children}</Tag>;
        };
      },
    },
  );
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion,
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
    function MockVenueScene3D(props: {
      onItemSelect?: (id: string) => void;
      onItemReservedSelect?: (id: string) => void;
    }) {
      return (
        <div data-testid="venue-scene-3d">
          <button type="button" onClick={() => props.onItemSelect?.(FIXTURE_LAYOUT_ITEM_ID)}>
            select-item
          </button>
          <button type="button" onClick={() => props.onItemSelect?.("missing-id")}>
            select-missing
          </button>
          <button type="button" onClick={() => props.onItemSelect?.("unknown-table")}>
            select-unknown-table
          </button>
          <button
            type="button"
            onClick={() => props.onItemReservedSelect?.(FIXTURE_LAYOUT_ITEM_ID)}
          >
            select-reserved
          </button>
          <button type="button" onClick={() => props.onItemReservedSelect?.("missing-id")}>
            select-reserved-unknown
          </button>
          <button type="button" onClick={() => props.onItemReservedSelect?.("nolabel-table")}>
            select-reserved-table-nolabel
          </button>
        </div>
      );
    },
}));

vi.mock("@/components/shared/site/Footer", () => ({
  default: () => <footer data-testid="site-footer" />,
  Footer: () => <footer data-testid="site-footer" />,
}));

const sceneLayout = vi.hoisted(() => ({
  isPhone: true,
  isTablet: false,
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
      isPhone: sceneLayout.isPhone,
      isTablet: sceneLayout.isTablet,
      isLaptop: false,
      isTv: false,
      dpr: 1,
      chromeCss: "14rem",
    }),
  };
});

const mounted = vi.hoisted(() => ({ value: true }));
let ioCallback: ((entries: Array<{ intersectionRatio?: number }>) => void) | null = null;

vi.mock("@/hooks/use-has-mounted", () => ({
  useHasMounted: () => mounted.value,
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

vi.mock("./VenueLayoutItemModal", () => ({
  default: ({
    reservationsClosedMessage,
    onClose,
  }: {
    reservationsClosedMessage?: string;
    onClose: () => void;
  }) => (
    <div data-testid="item-modal">
      {reservationsClosedMessage}
      <button type="button" onClick={onClose}>
        close-item
      </button>
    </div>
  ),
}));

vi.mock("@/lib/on-coming-events/venueSeatDisplayLabel", async (importOriginal) => {
  const actual = await importOriginal<
    typeof import("@/lib/on-coming-events/venueSeatDisplayLabel")
  >();
  return {
    ...actual,
    buildLayoutItemLabelMap: (
      items: Parameters<typeof actual.buildLayoutItemLabelMap>[0],
      tables: Parameters<typeof actual.buildLayoutItemLabelMap>[1],
      chairs: Parameters<typeof actual.buildLayoutItemLabelMap>[2],
    ) => {
      const map = actual.buildLayoutItemLabelMap(items, tables, chairs);
      for (const item of items) {
        if (item.id === "nolabel-table") {
          map.set(item.id, { short: "", full: "   " });
        }
      }
      return map;
    },
  };
});

import VenueLayoutPublicPage from "./VenueLayoutPublicPage";

function useHappyHandlers(extra?: {
  venueOk?: boolean;
  layoutOk?: boolean;
  eventDetail?: Record<string, unknown> | null;
  availability?: Record<string, unknown>;
  settings?: Record<string, unknown> | null;
}) {
  server.use(
    http.get("*/api/v1/upcoming-events/:slug/venue", () => {
      if (extra?.venueOk === false) {
        return HttpResponse.json({}, { status: 404 });
      }
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
        slug: FIXTURE_EVENT_SLUG,
      });
    }),
    http.get("*/api/v1/floor-layout", () => {
      if (extra?.layoutOk === false) {
        return HttpResponse.json({}, { status: 500 });
      }
      return HttpResponse.json(makeFloorLayoutApiPayload());
    }),
    http.get("*/api/v1/venue-tables", () => {
      return HttpResponse.json([makeVenueTableApiRow()]);
    }),
    http.get("*/api/v1/standalone-chairs", () => {
      return HttpResponse.json(makeStandaloneChairsApiPayload());
    }),
    http.get("*/api/v1/venue-reservations/availability", () => {
      return HttpResponse.json(
        makeVenueAvailability({
          ...(extra?.availability ?? {}),
        }),
      );
    }),
    http.get("*/api/v1/upcoming-events/:slug", ({ request }) => {
      if (request.url.includes("/venue")) {
        return undefined;
      }
      if (extra?.eventDetail === null) {
        return HttpResponse.json({}, { status: 500 });
      }
      return HttpResponse.json(
        makeOnComingEventDetail({
          slug: FIXTURE_EVENT_SLUG,
          purchaseMode: "venue_seating",
          eventStartsAt: "2030-08-01T20:00:00.000Z",
          tableCapacity: 10,
          tablesRemaining: 4,
          tablesSold: 6,
          ...(extra?.eventDetail ?? {}),
        }),
      );
    }),
    http.get("*/api/v1/on-coming-events/settings", () => {
      if (extra?.settings === null) {
        return HttpResponse.json({}, { status: 500 });
      }
      return HttpResponse.json({
        clientEnabled: true,
        promoTitle: "Promo night",
        promoDescription: "Come dance.",
        promoImageUrl: "https://cdn.example.com/promo.mp4",
        reservationEventLabel: "Promo",
        reservationEventDate: "2030-08-01",
        reservationOpensAt: "2030-07-01T12:00:00.000Z",
        ...(extra?.settings ?? {}),
      });
    }),
  );
}

describe("VenueLayoutPublicPage", () => {
  beforeEach(() => {
    clearVenueLayoutPageCache();
    mounted.value = true;
    sceneLayout.isPhone = true;
    sceneLayout.isTablet = false;
    ioCallback = null;
    class FakeIO {
      constructor(cb: (entries: Array<{ intersectionRatio?: number }>) => void) {
        ioCallback = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    }
    vi.stubGlobal("IntersectionObserver", FakeIO);
    useHappyHandlers();
  });

  it("ignores visibility refresh before the first load finishes", () => {
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });

  it("loads floor plan and renders 3D scene stub", async () => {
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    expect(screen.getByTestId("site-footer")).toBeInTheDocument();
  });

  it("opens item modal from scene select and closes it", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "select-item" }));
    expect(screen.getByTestId("item-modal")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "close-item" }));
    expect(screen.queryByTestId("item-modal")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "select-missing" }));
    expect(screen.queryByTestId("item-modal")).not.toBeInTheDocument();
  });

  it("selects a catalog table with no matching table config", async () => {
    const user = userEvent.setup();
    const payload = makeFloorLayoutApiPayload();
    server.use(
      http.get("*/api/v1/floor-layout", () =>
        HttpResponse.json({
          ...payload,
          items: [
            ...payload.items,
            {
              id: "unknown-table",
              kind: "catalog_table",
              venueTableConfigId: "missing-table-config",
              tableName: "Ghost",
              size: "LARGE",
              includedChairs: 8,
              x: 10,
              y: 10,
              rotation: 0,
            },
          ],
        }),
      ),
    );
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "select-unknown-table" }));
    expect(screen.getByTestId("item-modal")).toBeInTheDocument();
  });

  it("shows reserved alert for a labeled table", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "select-reserved" }));
    expect(screen.getByText("Already reserved")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "OK" }));
  });

  it("shows generic reserved copy when the item is unknown", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "select-reserved-unknown" }));
    expect(screen.getByText("Already reserved")).toBeInTheDocument();
    expect(screen.getByText(/this chair is already sold/i)).toBeInTheDocument();
  });

  it("shows generic reserved table copy when the label is blank", async () => {
    const user = userEvent.setup();
    const payload = makeFloorLayoutApiPayload();
    server.use(
      http.get("*/api/v1/floor-layout", () =>
        HttpResponse.json({
          ...payload,
          items: [
            ...payload.items,
            {
              id: "nolabel-table",
              kind: "catalog_table",
              venueTableConfigId: FIXTURE_TABLE_CONFIG_ID,
              tableName: "Large 1",
              size: "LARGE",
              includedChairs: 8,
              x: 40,
              y: 40,
              rotation: 0,
            },
          ],
        }),
      ),
    );
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "select-reserved-table-nolabel" }));
    expect(screen.getByText(/this table is already sold/i)).toBeInTheDocument();
  });

  it("shows unpublished copy when venue fetch fails", async () => {
    useHappyHandlers({ venueOk: false });
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    expect(
      await screen.findByText(/on coming events unavailable/i),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: /return to events/i }));
  });

  it("shows floor plan error when layout fetch fails", async () => {
    useHappyHandlers({ layoutOk: false });
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    expect(await screen.findByText(/floor plan is not available/i)).toBeInTheDocument();
  });

  it("shows chairs error when standalone chairs resolve empty", async () => {
    vi.spyOn(chairsService, "fetchPublicStandaloneChairs").mockResolvedValueOnce(
      null as never,
    );
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    expect(await screen.findByText(/floor plan is not available/i)).toBeInTheDocument();
  });

  it("shows catch error when the request throws", async () => {
    server.use(
      http.get("*/api/v1/floor-layout", () => HttpResponse.error()),
    );
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    expect(await screen.findByText(/could not load floor plan/i)).toBeInTheDocument();
  });

  it("accepts sparse venue and event-detail payloads", async () => {
    useHappyHandlers({
      eventDetail: {
        heroImageUrl: undefined,
        heroMediaType: undefined,
        price: undefined,
      },
    });
    server.use(
      http.get("*/api/v1/upcoming-events/:slug/venue", () =>
        HttpResponse.json({
          event: { items: [1, "Tables"] },
          config: {},
        }),
      ),
    );
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
  });

  it("uses venue event name and config date fallbacks", async () => {
    useHappyHandlers();
    server.use(
      http.get("*/api/v1/upcoming-events/:slug/venue", () =>
        HttpResponse.json({
          event: { eventTypeName: "Named gala", description: 12 },
          config: { reservationOpensAt: "2030-07-01T12:00:00.000Z" },
        }),
      ),
    );
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
  });

  it("uses venue config label when the event name is blank", async () => {
    useHappyHandlers();
    server.use(
      http.get("*/api/v1/upcoming-events/:slug/venue", () =>
        HttpResponse.json({
          event: { eventTypeName: "   " },
          config: { reservationEventLabel: "From config" },
        }),
      ),
    );
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
  });

  it("still renders when event detail fetch fails", async () => {
    useHappyHandlers({ eventDetail: null });
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
  });

  it("loads legacy settings without a slug", async () => {
    renderWithProviders(<VenueLayoutPublicPage />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
  });

  it("hides the floor plan when settings are unpublished", async () => {
    useHappyHandlers({ settings: { clientEnabled: false } });
    renderWithProviders(<VenueLayoutPublicPage />);
    expect(
      await screen.findByText(/on coming events unavailable/i),
    ).toBeInTheDocument();
  });

  it("passes sales-closed copy into the item modal", async () => {
    const user = userEvent.setup();
    useHappyHandlers({
      availability: { reservationsOpen: false, salesClosedReason: "ended" },
    });
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "select-item" }));
    expect(screen.getByTestId("item-modal")).toHaveTextContent(/reservations have closed/i);
  });

  it("shows a future countdown without table inventory", async () => {
    useHappyHandlers({
      eventDetail: {
        eventStartsAt: "2035-01-01T20:00:00.000Z",
        tableCapacity: null,
        tablesRemaining: null,
        tablesSold: null,
      },
    });
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
  });

  it("falls back remaining tables to capacity when remaining is null", async () => {
    useHappyHandlers({
      eventDetail: {
        eventStartsAt: "2020-01-01T20:00:00.000Z",
        tableCapacity: 10,
        tablesRemaining: null,
        tablesSold: 0,
      },
    });
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
  });

  it("uses tablet legend placement", async () => {
    sceneLayout.isPhone = false;
    sceneLayout.isTablet = true;
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
  });

  it("shows sold-out seating copy", async () => {
    useHappyHandlers({
      eventDetail: { tableCapacity: 8, tablesRemaining: 0, tablesSold: 8 },
    });
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    expect(await screen.findByText(/all tables have been sold/i)).toBeInTheDocument();
  });

  it("hydrates from cache without refetching layout", async () => {
    setVenueLayoutPageCache(FIXTURE_EVENT_SLUG, {
      layout: makeFloorLayoutApiPayload() as never,
      tables: [makeVenueTableApiRow() as never],
      standaloneChairs: makeStandaloneChairsApiPayload() as never,
      clientEnabled: true,
      eventLabel: "Cached gala",
      eventTitle: "Cached gala",
      eventDescription: "From cache",
      eventItems: ["Cached"],
      heroImageUrl: null,
      heroMediaType: null,
      eventPrice: 10,
      eventDateIso: "2030-08-01",
      reservationsOpen: true,
      salesClosedReason: null,
      reservedLayoutItemIds: [],
      paidSeatHolders: [],
    });
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
  });

  it("refreshes availability when the tab becomes visible", async () => {
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
  });

  it("keeps the cached floor plan when a silent availability refresh fails", async () => {
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    server.use(
      http.get("*/api/v1/venue-reservations/availability", () => HttpResponse.error()),
    );
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
  });

  it("applies paid seat holders and IntersectionObserver visibility", async () => {
    useHappyHandlers({
      availability: {
        eventDate: null,
        paidSeatHolders: [
          { layoutItemId: FIXTURE_LAYOUT_ITEM_ID, customerName: "Ada" },
          { layoutItemId: "   ", customerName: "Skip" },
        ],
      },
    });
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    ioCallback?.([]);
    ioCallback?.([{ intersectionRatio: 0 }]);
    ioCallback?.([{ intersectionRatio: 0.2 }]);
    expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
  });

  it("starts the leaving overlay from the hero back control", async () => {
    const user = userEvent.setup();
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /^back$/i }));
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("treats a thrown venue request as unpublished", async () => {
    server.use(
      http.get("*/api/v1/upcoming-events/:slug/venue", () => HttpResponse.error()),
    );
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    expect(
      await screen.findByText(/on coming events unavailable/i),
    ).toBeInTheDocument();
  });

  it("coalesces in-flight loads when the first fetch leaves no cache", async () => {
    server.use(
      http.get("*/api/v1/floor-layout", async () => {
        await delay(80);
        return HttpResponse.json({}, { status: 500 });
      }),
    );
    renderWithProviders(
      <>
        <VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />
        <VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />
      </>,
    );
    expect((await screen.findAllByText(/floor plan is not available/i)).length).toBeGreaterThan(0);
  });

  it("coalesces in-flight loads for the same slug", async () => {
    server.use(
      http.get("*/api/v1/floor-layout", async () => {
        await delay(80);
        return HttpResponse.json(makeFloorLayoutApiPayload());
      }),
    );
    renderWithProviders(
      <>
        <VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />
        <VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />
      </>,
    );
    await waitFor(() => {
      expect(screen.getAllByTestId("venue-scene-3d").length).toBeGreaterThan(0);
    });
  });

  it("keeps cached UI when a silent reload fails", async () => {
    setVenueLayoutPageCache(FIXTURE_EVENT_SLUG, {
      layout: makeFloorLayoutApiPayload() as never,
      tables: [makeVenueTableApiRow() as never],
      standaloneChairs: makeStandaloneChairsApiPayload() as never,
      clientEnabled: true,
      eventLabel: "Cached gala",
      eventTitle: "Cached gala",
      eventDescription: "From cache",
      eventItems: ["Cached"],
      heroImageUrl: null,
      heroMediaType: null,
      eventPrice: 10,
      eventDateIso: "2030-08-01",
      reservationsOpen: true,
      salesClosedReason: null,
      reservedLayoutItemIds: [],
      reservedVenueTableConfigIds: [],
      reservedSeatShortLabels: [],
      paidSeatHolders: [],
    });
    server.use(
      http.get("*/api/v1/floor-layout", () => HttpResponse.error()),
    );
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
  });

  it("loads settings with an image promo and a null event label", async () => {
    useHappyHandlers({
      settings: {
        promoTitle: "Image night",
        promoImageUrl: "https://cdn.example.com/promo.jpg",
        reservationEventLabel: null,
      },
    });
    renderWithProviders(<VenueLayoutPublicPage />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
  });

  it("loads settings with a video promo and label title", async () => {
    useHappyHandlers({
      settings: {
        promoTitle: "   ",
        promoDescription: "Promo copy",
        promoImageUrl: "https://cdn.example.com/promo.mp4",
        reservationEventLabel: "Gala from settings",
        reservationEventDate: "2030-08-01",
        reservationOpensAt: null,
      },
    });
    renderWithProviders(<VenueLayoutPublicPage />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
  });

  it("loads settings fallbacks without promo media or dates", async () => {
    useHappyHandlers({
      settings: {
        promoTitle: "",
        promoDescription: undefined,
        promoImageUrl: "",
        reservationEventLabel: "",
        reservationEventDate: null,
        reservationOpensAt: null,
      },
    });
    renderWithProviders(<VenueLayoutPublicPage />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
  });

  it("shows floor-plan fallback copy when cache has no layout", async () => {
    setVenueLayoutPageCache(FIXTURE_EVENT_SLUG, {
      layout: null as never,
      tables: [makeVenueTableApiRow() as never],
      standaloneChairs: makeStandaloneChairsApiPayload() as never,
      clientEnabled: true,
      eventLabel: "Cached gala",
      eventTitle: "Cached gala",
      eventDescription: "From cache",
      eventItems: ["Cached"],
      heroImageUrl: null,
      heroMediaType: null,
      eventPrice: 10,
      eventDateIso: "2030-08-01",
      reservationsOpen: true,
      salesClosedReason: null,
      reservedLayoutItemIds: [],
      reservedVenueTableConfigIds: [],
      reservedSeatShortLabels: [],
      paidSeatHolders: [],
    });
    server.use(
      http.get("*/api/v1/floor-layout", async () => {
        await delay(40);
        return HttpResponse.json(makeFloorLayoutApiPayload());
      }),
    );
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    expect(await screen.findByText("Floor plan unavailable.")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
  });

  it("shows the scene placeholder before mount", async () => {
    mounted.value = false;
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.queryByTestId("venue-scene-3d")).not.toBeInTheDocument();
    });
  });

  it("refreshes availability on the settings-only page", async () => {
    renderWithProviders(<VenueLayoutPublicPage />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
  });

  it("keeps the event date when availability omits it", async () => {
    useHappyHandlers({ availability: { eventDate: null } });
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });

  it("swallows event-detail failures during visibility refresh", async () => {
    renderWithProviders(<VenueLayoutPublicPage eventSlug={FIXTURE_EVENT_SLUG} />);
    await waitFor(() => {
      expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
    });
    vi.spyOn(eventDetailService, "fetchOnComingEventDetail").mockRejectedValue(
      new Error("detail down"),
    );
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(screen.getByTestId("venue-scene-3d")).toBeInTheDocument();
  });
});
