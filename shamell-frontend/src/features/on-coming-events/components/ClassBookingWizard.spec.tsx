/** @vitest-environment jsdom */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMockClassBookingWizardProps } from "../test/helpers/mockOnComingEventsPage";
import { renderWithProviders } from "../test/utils/renderWithProviders";
import {
  makeClassSession,
  makeMonthPackage,
  makeRecurringSchedule,
} from "../test/fixtures/onComingEvents.fixture";
import { FIXTURE_SESSION_ID, FIXTURE_SECTION_ID } from "../test/fixtures/uuids.fixture";
import type { ClassCartItem } from "../types/classSessionCart.types";

const checkoutMocks = vi.hoisted(() => ({
  createClassCartCheckoutSession: vi.fn(),
  createClassMonthPackageCheckoutSession: vi.fn(),
  createClassCheckoutSession: vi.fn(),
}));

const scheduleGrid = vi.hoisted(() => ({ nextNull: false }));

vi.mock("../lib/buildScheduleMonthGrid", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/buildScheduleMonthGrid")>();
  return {
    ...actual,
    getNextOccurrence: (...args: Parameters<typeof actual.getNextOccurrence>) =>
      scheduleGrid.nextNull ? null : actual.getNextOccurrence(...args),
  };
});

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
    "layoutId",
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

vi.mock("@/components/stripe", () => ({
  StripeCheckoutHost: ({ clientSecret }: { clientSecret: string }) => (
    <div data-testid="stripe-checkout">{clientSecret}</div>
  ),
}));

vi.mock("@/hooks/use-media-query", () => ({
  useMediaQuery: () => true,
}));

vi.mock("./MonthPackageIncludedSessions", () => ({
  MonthPackageIncludedSessions: () => <div data-testid="month-sessions" />,
}));

vi.mock("../services/createClassCartCheckoutSession", () => ({
  createClassCartCheckoutSession: (...args: unknown[]) =>
    checkoutMocks.createClassCartCheckoutSession(...args),
}));

vi.mock("../services/createClassMonthPackageCheckoutSession", () => ({
  createClassMonthPackageCheckoutSession: (...args: unknown[]) =>
    checkoutMocks.createClassMonthPackageCheckoutSession(...args),
}));

vi.mock("../services/createClassCheckoutSession", () => ({
  createClassCheckoutSession: (...args: unknown[]) =>
    checkoutMocks.createClassCheckoutSession(...args),
}));

import { ClassBookingWizard, weekdayFromIsoDate, fromIsoForSchedule } from "./ClassBookingWizard";

const DATE_ISO = "2030-08-05";

const cartItem: ClassCartItem = {
  sessionId: FIXTURE_SESSION_ID,
  dateIso: DATE_ISO,
  weekday: 1,
  sectionId: "sec-1",
  label: "Beginner",
  startTime: "19:00",
  endTime: "20:00",
  price: 25,
  capacity: 20,
  seatsRemaining: 12,
};

function renderWizard(
  overrides: Record<string, unknown> = {},
) {
  const props = createMockClassBookingWizardProps({
    sessions: [
      makeClassSession({
        startsAt: "2030-08-05T23:00:00.000Z",
        endsAt: "2030-08-06T00:00:00.000Z",
        weekday: 1,
      }),
    ],
    ...overrides,
  });
  return {
    props,
    ...renderWithProviders(<ClassBookingWizard {...props} />),
  };
}

describe("ClassBookingWizard", () => {
  beforeEach(() => {
    scheduleGrid.nextNull = false;
    checkoutMocks.createClassCartCheckoutSession.mockReset();
    checkoutMocks.createClassMonthPackageCheckoutSession.mockReset();
    checkoutMocks.createClassCheckoutSession.mockReset();
  });

  it("renders day selection step when open", () => {
    renderWizard();
    expect(screen.getByText("Book a class")).toBeInTheDocument();
    expect(screen.getByText("Choose a day")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /monday/i })).toBeInTheDocument();
  });

  it("does not close when the dimmed backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWizard({ onClose });
    const dialog = screen.getByRole("dialog");
    const overlay = dialog.parentElement;
    expect(overlay).toBeTruthy();
    if (overlay) await user.click(overlay);
    expect(onClose).not.toHaveBeenCalled();
    expect(document.body.getAttribute("data-public-checkout-modal")).toBe("open");
  });

  it("does not render when closed", () => {
    renderWizard({ open: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("maps weekdayFromIsoDate", () => {
    expect(weekdayFromIsoDate("2030-08-05")).toBe(new Date(2030, 7, 5).getDay());
    expect(weekdayFromIsoDate("not-a-date")).toBeNull();
    expect(fromIsoForSchedule(null, "2030-01-01")).toBe("2030-01-01");
    expect(
      fromIsoForSchedule({ mode: "FIXED_EVENT" } as never, "2030-01-01"),
    ).toBe("2030-01-01");
    expect(
      fromIsoForSchedule(makeRecurringSchedule({ effectiveFrom: "" }), "2030-01-01"),
    ).toBe("2030-01-01");
    expect(
      fromIsoForSchedule(makeRecurringSchedule({ effectiveFrom: "2099-01-01" }), "2030-01-01"),
    ).toBe("2099-01-01");
  });

  it("closes from the header close button", async () => {
    const user = userEvent.setup();
    const { props } = renderWizard();
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(props.onClose).toHaveBeenCalled();
  });

  it("picks a day then buys a section via cart checkout", async () => {
    const user = userEvent.setup();
    checkoutMocks.createClassCartCheckoutSession.mockResolvedValue({
      ok: true,
      clientSecret: "cs_day",
    });
    renderWizard({
      initialWeekday: 1,
      initialDateIso: DATE_ISO,
    });
    expect(screen.getByText(/monday/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /beginner/i }));
    await user.click(screen.getByRole("button", { name: /buy now/i }));
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.type(screen.getByPlaceholderText("Phone (optional)"), "555");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    await waitFor(() => {
      expect(screen.getByTestId("stripe-checkout")).toHaveTextContent("cs_day");
    });
  });

  it("buys two selected classes in one day checkout", async () => {
    const user = userEvent.setup();
    checkoutMocks.createClassCartCheckoutSession.mockResolvedValue({
      ok: true,
      clientSecret: "cs_two",
    });
    renderWizard({
      initialWeekday: 1,
      initialDateIso: DATE_ISO,
      schedule: makeRecurringSchedule({
        days: [
          {
            weekday: 1,
            label: "Monday",
            sections: [
              {
                id: FIXTURE_SECTION_ID,
                label: "Beginner",
                startTime: "19:00",
                endTime: "20:00",
                sortOrder: 0,
              },
              {
                id: "sec-2",
                label: "Advanced",
                startTime: "20:00",
                endTime: "21:00",
                sortOrder: 1,
              },
            ],
          },
        ],
      }),
      sessions: [
        makeClassSession({
          startsAt: "2030-08-05T23:00:00.000Z",
          endsAt: "2030-08-06T00:00:00.000Z",
          weekday: 1,
        }),
        makeClassSession({
          id: "os-adv",
          sectionId: "sec-2",
          sectionLabel: "Advanced",
          startsAt: "2030-08-06T00:00:00.000Z",
          endsAt: "2030-08-06T01:00:00.000Z",
          weekday: 1,
        }),
      ],
    });
    await user.click(screen.getByLabelText("Select all"));
    await user.click(screen.getByRole("button", { name: /buy now/i }));
    expect(screen.getByText(/2 classes selected/i)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    await waitFor(() => {
      expect(screen.getByTestId("stripe-checkout")).toHaveTextContent("cs_two");
    });
  });

  it("adds the selected sections to the cart", async () => {
    const user = userEvent.setup();
    const onReplaceDayCart = vi.fn();
    const onClose = vi.fn();
    renderWizard({
      initialWeekday: 1,
      initialDateIso: DATE_ISO,
      onReplaceDayCart,
      onClose,
    });
    await user.click(screen.getByLabelText("Select all"));
    await user.click(screen.getByLabelText("Select all"));
    await user.click(screen.getByLabelText("Select all"));
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(onReplaceDayCart).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("does not add to cart without a handler or a priced session", async () => {
    const user = userEvent.setup();
    const first = renderWizard({
      initialWeekday: 1,
      initialDateIso: DATE_ISO,
    });
    await user.click(screen.getByLabelText("Select all"));
    fireEvent.click(screen.getByRole("button", { name: /add to cart/i }));
    first.unmount();

    const onReplaceDayCart = vi.fn();
    renderWizard({
      initialWeekday: 1,
      initialDateIso: DATE_ISO,
      onReplaceDayCart,
      sessions: [
        makeClassSession({
          startsAt: "2030-08-05T23:00:00.000Z",
          endsAt: "2030-08-06T00:00:00.000Z",
          weekday: 1,
          price: null as never,
        }),
      ],
    });
    await user.click(screen.getByLabelText("Select all"));
    await user.click(screen.getByRole("button", { name: /add to cart/i }));
    expect(onReplaceDayCart).toHaveBeenCalledWith(DATE_ISO, []);
  });

  it("returns to day picker from sections when initialDateIso is omitted", async () => {
    const user = userEvent.setup();
    renderWizard({ initialWeekday: 1 });
    await user.click(screen.getByRole("button", { name: /change day/i }));
    expect(screen.getByText("Choose a day")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /monday/i }));
    expect(screen.getByText(/section/i)).toBeInTheDocument();
  });

  it("updates cart when the day is already in the cart", async () => {
    const user = userEvent.setup();
    const onReplaceDayCart = vi.fn();
    const onClose = vi.fn();
    renderWizard({
      initialWeekday: 1,
      initialDateIso: DATE_ISO,
      cartItems: [cartItem],
      onReplaceDayCart,
      onClose,
    });
    expect(screen.getByRole("button", { name: /update cart/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /beginner/i }));
    await user.click(screen.getByLabelText("Select all"));
    await user.click(screen.getByRole("button", { name: /update cart/i }));
    expect(onReplaceDayCart).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("shows checkout error when day cart checkout fails", async () => {
    const user = userEvent.setup();
    checkoutMocks.createClassCartCheckoutSession.mockResolvedValue({
      ok: false,
      message: "Sold out",
    });
    renderWizard({
      initialWeekday: 1,
      initialDateIso: DATE_ISO,
    });
    await user.click(screen.getByRole("button", { name: /beginner/i }));
    await user.click(screen.getByRole("button", { name: /buy now/i }));
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(await screen.findByText("Sold out")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /back to sections/i }));
    expect(screen.getByRole("button", { name: /buy now/i })).toBeInTheDocument();
  });

  it("errors when buying with no selected classes", async () => {
    const user = userEvent.setup();
    renderWizard({
      initialWeekday: 1,
      initialDateIso: DATE_ISO,
    });
    const buy = screen.getByRole("button", { name: /buy now/i });
    expect(buy).toBeDisabled();
    await user.click(buy);
    expect(checkoutMocks.createClassCartCheckoutSession).not.toHaveBeenCalled();
  });

  it("opens month package confirm and checks out", async () => {
    const user = userEvent.setup();
    checkoutMocks.createClassMonthPackageCheckoutSession.mockResolvedValue({
      ok: true,
      clientSecret: "cs_month",
    });
    renderWizard({
      entryFlow: "month",
      monthPackage: makeMonthPackage(),
      sessions: [
        makeClassSession({
          startsAt: "2030-08-05T23:00:00.000Z",
          endsAt: "2030-08-06T00:00:00.000Z",
        }),
      ],
    });
    expect(screen.getByText("Confirm full month package")).toBeInTheDocument();
    expect(screen.getByTestId("month-sessions")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /confirm purchase/i }));
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    await waitFor(() => {
      expect(screen.getByTestId("stripe-checkout")).toHaveTextContent("cs_month");
    });
  });

  it("shows empty month sessions and month checkout error", async () => {
    const user = userEvent.setup();
    checkoutMocks.createClassMonthPackageCheckoutSession.mockResolvedValue({
      ok: false,
      message: "Month unavailable",
    });
    renderWizard({
      entryFlow: "month",
      monthPackage: makeMonthPackage({
        currentMonthIso: "2030-09",
        currentMonthSessionCount: 1,
        label: "  ",
      }),
      sessions: [],
    });
    expect(screen.getByText("Buy full month")).toBeInTheDocument();
    expect(screen.getByText(/no upcoming sessions available for this month/i)).toBeInTheDocument();
    expect(screen.getByText(/1 class included/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /confirm purchase/i }));
    await user.click(screen.getByRole("button", { name: /back to package/i }));
    await user.click(screen.getByRole("button", { name: /confirm purchase/i }));
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(await screen.findByText("Month unavailable")).toBeInTheDocument();
  });

  it("shows month details with a zero session count", async () => {
    const user = userEvent.setup();
    renderWizard({
      entryFlow: "month",
      monthPackage: makeMonthPackage({
        price: undefined as never,
        currentMonthSessionCount: 0,
      }),
      sessions: [],
    });
    await user.click(screen.getByRole("button", { name: /confirm purchase/i }));
    expect(screen.getByText(/0 classes included/i)).toBeInTheDocument();
    expect(screen.getByText(/total \$0\.00/i)).toBeInTheDocument();
  });

  it("falls back to month preview count when package count is missing", async () => {
    const user = userEvent.setup();
    renderWizard({
      entryFlow: "month",
      monthPackage: makeMonthPackage({
        currentMonthSessionCount: undefined as never,
      }),
      sessions: [
        makeClassSession({
          startsAt: "2030-08-05T23:00:00.000Z",
          endsAt: "2030-08-06T00:00:00.000Z",
        }),
      ],
    });
    expect(screen.getByText(/1 class included/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /confirm purchase/i }));
    expect(screen.getByText(/1 class included/i)).toBeInTheDocument();
  });

  it("reviews cart, removes an item, and checks out", async () => {
    const user = userEvent.setup();
    const onRemoveCartItem = vi.fn();
    const onCartCheckoutStarted = vi.fn();
    checkoutMocks.createClassCartCheckoutSession.mockResolvedValue({
      ok: true,
      clientSecret: "cs_cart",
    });
    renderWizard({
      entryFlow: "cart",
      monthPackage: makeMonthPackage(),
      cartItems: [
        cartItem,
        { ...cartItem, sessionId: "os-other", dateIso: "2030-08-06", weekday: 2 },
      ],
      onRemoveCartItem,
      onCartCheckoutStarted,
    });
    expect(screen.getByText("Your classes")).toBeInTheDocument();
    expect(screen.getByText("Checkout")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Remove" })[0]!);
    expect(onRemoveCartItem).toHaveBeenCalledWith(FIXTURE_SESSION_ID);
    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    await waitFor(() => {
      expect(onCartCheckoutStarted).toHaveBeenCalled();
      expect(screen.getByTestId("stripe-checkout")).toHaveTextContent("cs_cart");
    });
  });

  it("shows empty cart and cart checkout errors", async () => {
    const user = userEvent.setup();
    checkoutMocks.createClassCartCheckoutSession.mockResolvedValue({
      ok: false,
      message: "Cart failed",
    });
    const { rerender, props } = renderWizard({
      entryFlow: "cart",
      cartItems: [cartItem],
    });
    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(await screen.findByText("Cart failed")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /back to cart/i }));

    rerender(
      <ClassBookingWizard {...props} cartItems={[]} />,
    );
    expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it("checks out an empty cart from details after items are cleared", async () => {
    const user = userEvent.setup();
    const { rerender, props } = renderWizard({
      entryFlow: "cart",
      cartItems: [cartItem],
    });
    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    rerender(<ClassBookingWizard {...props} cartItems={[]} />);
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(await screen.findByText("Your cart is empty.")).toBeInTheDocument();
  });

  it("uses legacy session checkout when there is no recurring schedule", async () => {
    const user = userEvent.setup();
    checkoutMocks.createClassCheckoutSession.mockResolvedValue({
      ok: true,
      clientSecret: "cs_legacy",
    });
    renderWizard({
      schedule: null,
      sessions: [makeClassSession({ seatsRemaining: 4 })],
    });
    expect(screen.getByText("Choose a session")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /\$25/i }));
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    await waitFor(() => {
      expect(screen.getByTestId("stripe-checkout")).toHaveTextContent("cs_legacy");
    });
  });

  it("shows empty legacy list and legacy checkout error", async () => {
    const user = userEvent.setup();
    checkoutMocks.createClassCheckoutSession.mockResolvedValue({
      ok: false,
      message: "Session gone",
    });
    renderWizard({
      schedule: {
        mode: "FIXED_EVENT",
        timezone: "America/New_York",
        summary: "Gala",
        salesWindow: null,
        eventDate: "2030-08-01",
        startTime: "19:00",
        endTime: "21:00",
      },
      sessions: [makeClassSession({ seatsRemaining: 3 })],
    });
    await user.click(screen.getByRole("button", { name: /\$25/i }));
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(await screen.findByText("Session gone")).toBeInTheDocument();

    renderWizard({
      schedule: null,
      sessions: [makeClassSession({ seatsRemaining: 0 })],
    });
    expect(screen.getAllByText(/no upcoming sessions available/i).length).toBeGreaterThan(0);
  });

  it("jumps to sections from initialWeekday only", async () => {
    renderWizard({ initialWeekday: 1 });
    expect(await screen.findByText(/section/i)).toBeInTheDocument();
  });

  it("shows sections without a matching weekday label", () => {
    renderWizard({
      initialWeekday: 2,
      initialDateIso: DATE_ISO,
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows no sections copy when the date has no offers", () => {
    renderWizard({
      initialWeekday: 1,
      initialDateIso: DATE_ISO,
      schedule: makeRecurringSchedule({
        days: [{ weekday: 1, label: "Monday", sections: [] }],
      }),
      sessions: [],
    });
    expect(
      screen.getByText(/no class sections are scheduled for this date/i),
    ).toBeInTheDocument();
  });

  it("falls back to the raw date when the iso cannot be parsed", () => {
    renderWizard({
      initialWeekday: 1,
      initialDateIso: "not-a-date",
    });
    expect(screen.getByText("not-a-date")).toBeInTheDocument();
  });

  it("sorts multiple legacy sessions and types a phone", async () => {
    const user = userEvent.setup();
    checkoutMocks.createClassCheckoutSession.mockResolvedValue({
      ok: true,
      clientSecret: "cs_legacy2",
    });
    renderWizard({
      schedule: null,
      sessions: [
        makeClassSession({
          id: "os-b",
          startsAt: "2030-08-06T23:00:00.000Z",
          seatsRemaining: 2,
        }),
        makeClassSession({
          id: "os-a",
          startsAt: "2030-08-04T23:00:00.000Z",
          seatsRemaining: 4,
        }),
        makeClassSession({
          id: "os-zero",
          startsAt: "2030-08-05T23:00:00.000Z",
          seatsRemaining: 0,
        }),
      ],
    });
    await user.click(screen.getAllByRole("button", { name: /\$25/i })[0]!);
    await user.type(screen.getByPlaceholderText("Full name"), "Ada");
    await user.type(screen.getByPlaceholderText("Email"), "ada@example.com");
    await user.type(screen.getByPlaceholderText("Phone (optional)"), "555");
    await user.click(screen.getByRole("button", { name: /continue to payment/i }));
    await waitFor(() => {
      expect(screen.getByTestId("stripe-checkout")).toHaveTextContent("cs_legacy2");
    });
  });

  it("uses the schedule timezone and day buttons from the fixture", async () => {
    const user = userEvent.setup();
    renderWizard({
      schedule: makeRecurringSchedule({
        timezone: "America/New_York",
        effectiveFrom: "2099-01-01",
      }),
    });
    await user.click(screen.getByRole("button", { name: /monday/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("stays on the day step when the next occurrence is missing", async () => {
    scheduleGrid.nextNull = true;
    renderWizard({ initialWeekday: 1 });
    expect(screen.getByText("Choose a day")).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /monday/i }));
    expect(screen.getByText("Choose a day")).toBeInTheDocument();
  });
});
