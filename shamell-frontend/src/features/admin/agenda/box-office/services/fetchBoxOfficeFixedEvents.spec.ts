import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/server";
import {
  FIXTURE_FIXED_EVENT_ID,
  FIXTURE_VENUE_EVENT_ID,
} from "../test/fixtures/uuids.fixture";
import { fetchBoxOfficeFixedEvents } from "./fetchBoxOfficeFixedEvents";

const ROUTE = "*/api/v1/upcoming-events/admin/box-office/fixed-events";

describe("fetchBoxOfficeFixedEvents", () => {
  it("maps and normalizes venue-seating and fixed-ticket events", async () => {
    const events = await fetchBoxOfficeFixedEvents("token-1");

    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({
      id: FIXTURE_VENUE_EVENT_ID,
      name: "Gala Night",
      slug: "gala-night",
      purchaseKind: "venue_seating",
      ticketMode: "SINGLE",
      price: null,
      currency: "usd",
      ticketsRemaining: null,
      packages: [],
    });
    expect(events[1]).toMatchObject({
      id: FIXTURE_FIXED_EVENT_ID,
      name: "Showcase",
      slug: "showcase",
      purchaseKind: "fixed_ticket",
      ticketMode: "SINGLE",
      price: 45,
      currency: "usd",
      ticketsRemaining: 12,
      fixedTicketCapacity: 100,
      packages: [],
    });
  });

  it("maps PACKAGES ticketMode and package inventory", async () => {
    server.use(
      http.get(ROUTE, () =>
        HttpResponse.json({
          events: [
            {
              id: FIXTURE_FIXED_EVENT_ID,
              name: "Showcase",
              slug: "showcase",
              purchaseKind: "fixed_ticket",
              ticketMode: "PACKAGES",
              price: 85,
              currency: "usd",
              ticketsRemaining: 35,
              fixedTicketCapacity: null,
              packages: [
                {
                  id: "pkg-1",
                  title: "VIP",
                  price: 85,
                  capacity: 40,
                  sold: 5,
                  remaining: 35,
                },
              ],
              floorLayoutId: null,
              eventDateIso: null,
              eventLabel: null,
            },
          ],
        }),
      ),
    );

    const events = await fetchBoxOfficeFixedEvents("token-1");
    expect(events).toEqual([
      {
        id: FIXTURE_FIXED_EVENT_ID,
        name: "Showcase",
        slug: "showcase",
        purchaseKind: "fixed_ticket",
        ticketMode: "PACKAGES",
        price: 85,
        currency: "usd",
        ticketsRemaining: 35,
        fixedTicketCapacity: null,
        packages: [
          {
            id: "pkg-1",
            title: "VIP",
            price: 85,
            capacity: 40,
            sold: 5,
            remaining: 35,
          },
        ],
        floorLayoutId: null,
        eventDateIso: null,
        eventLabel: null,
      },
    ]);
  });

  it("coerces a numeric-string price and defaults an unknown purchaseKind to venue_seating", async () => {
    server.use(
      http.get(ROUTE, () =>
        HttpResponse.json({
          events: [
            {
              id: "evt-1",
              name: "Weird Row",
              slug: null,
              purchaseKind: "something_else",
              price: "45.5",
              ticketsRemaining: null,
              fixedTicketCapacity: null,
              floorLayoutId: null,
              eventDateIso: null,
              eventLabel: null,
            },
          ],
        }),
      ),
    );

    const events = await fetchBoxOfficeFixedEvents("token-1");
    expect(events).toEqual([
      {
        id: "evt-1",
        name: "Weird Row",
        slug: null,
        purchaseKind: "venue_seating",
        ticketMode: "SINGLE",
        price: 45.5,
        currency: "usd",
        ticketsRemaining: null,
        fixedTicketCapacity: null,
        packages: [],
        floorLayoutId: null,
        eventDateIso: null,
        eventLabel: null,
      },
    ]);
  });

  it("returns an empty list when events is missing", async () => {
    server.use(http.get(ROUTE, () => HttpResponse.json({})));
    await expect(fetchBoxOfficeFixedEvents("token-1")).resolves.toEqual([]);
  });

  it("throws the API message on failure", async () => {
    server.use(
      http.get(ROUTE, () =>
        HttpResponse.json({ message: "Forbidden" }, { status: 403 }),
      ),
    );
    await expect(fetchBoxOfficeFixedEvents("token-1")).rejects.toThrow(
      "Forbidden",
    );
  });

  it("throws a default message when the error body has none", async () => {
    server.use(http.get(ROUTE, () => HttpResponse.json({}, { status: 500 })));
    await expect(fetchBoxOfficeFixedEvents("token-1")).rejects.toThrow(
      "Could not load Box Office events.",
    );
  });
});
