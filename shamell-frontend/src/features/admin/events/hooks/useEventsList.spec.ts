/** @vitest-environment jsdom */

import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { makeAdminEvent } from "../test/fixtures/events.fixture";
import { FIXTURE_EVENT_ID, FIXTURE_EVENT_ID_2 } from "../test/fixtures/uuids.fixture";
import { PAGE_SIZE } from "../lib/eventsConstants";
import { useEventsList } from "./useEventsList";

const twoEvents = [
  makeAdminEvent({
    isActive: true,
    description: "An elegant private wedding package with full staging.",
    items: ["Dance set", "Sound check"],
    publicSection: "GENERAL",
  }),
  makeAdminEvent({
    id: FIXTURE_EVENT_ID_2,
    isActive: false,
    description: "Corporate gala night with VIP tables.",
    items: ["Host"],
    price: 1800,
    publicSection: "UPCOMING_EVENTS",
    catalogImages: [],
  }),
];

describe("useEventsList", () => {
  it("exposes stats and single-page pagination for two events", () => {
    const { result } = renderHook(() => useEventsList(twoEvents, "ALL"));

    expect(result.current.searchedEvents).toHaveLength(2);
    expect(result.current.stats).toEqual({
      total: 2,
      activeCount: 1,
      inactiveCount: 1,
      itemsTotal: 3,
    });
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginatedEvents).toHaveLength(2);
    expect(result.current.pageOffset).toBe(0);
  });

  it("filters by searchQuery against description text", () => {
    const { result } = renderHook(() => useEventsList(twoEvents, "ALL"));

    act(() => {
      result.current.setSearchQuery("corporate gala");
    });

    expect(result.current.searchedEvents).toHaveLength(1);
    expect(result.current.searchedEvents[0]?.id).toBe(FIXTURE_EVENT_ID_2);
    expect(result.current.page).toBe(1);
  });

  it("filters by sectionFilter GENERAL and UPCOMING_EVENTS", () => {
    const { result } = renderHook(() => useEventsList(twoEvents, "ALL"));

    act(() => {
      result.current.setSectionFilter("GENERAL");
    });
    expect(result.current.searchedEvents).toHaveLength(1);
    expect(result.current.searchedEvents[0]?.id).toBe(FIXTURE_EVENT_ID);
    expect(result.current.sectionEventsCount).toBe(1);
    expect(result.current.stats).toEqual({
      total: 1,
      activeCount: 1,
      inactiveCount: 0,
      itemsTotal: 2,
    });

    act(() => {
      result.current.setSectionFilter("UPCOMING_EVENTS");
    });
    expect(result.current.searchedEvents).toHaveLength(1);
    expect(result.current.searchedEvents[0]?.id).toBe(FIXTURE_EVENT_ID_2);
    expect(result.current.stats.activeCount).toBe(0);
    expect(result.current.stats.inactiveCount).toBe(1);
  });

  it(`paginates searched events with PAGE_SIZE=${PAGE_SIZE}`, () => {
    const many = Array.from({ length: PAGE_SIZE + 1 }, (_, i) =>
      makeAdminEvent({
        id: `ev${String(i).padStart(6, "0")}-1111-4111-8111-111111111111`,
        description: `Event description number ${i} for pagination.`,
        items: [`Item ${i}`],
      }),
    );

    const { result } = renderHook(() => useEventsList(many, "ALL"));

    expect(result.current.searchedEvents).toHaveLength(PAGE_SIZE + 1);
    expect(result.current.totalPages).toBe(2);
    expect(result.current.paginatedEvents).toHaveLength(PAGE_SIZE);
    expect(result.current.safePage).toBe(1);
    expect(result.current.pageOffset).toBe(0);

    act(() => {
      result.current.setPage(2);
    });

    expect(result.current.safePage).toBe(2);
    expect(result.current.pageOffset).toBe(PAGE_SIZE);
    expect(result.current.paginatedEvents).toHaveLength(1);
  });
});
