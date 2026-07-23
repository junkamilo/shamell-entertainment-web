/** @vitest-environment jsdom */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { makeBookClassEventContext } from "../test/fixtures/bookClass.fixture";
import { FIXTURE_CLASS_EVENT_ID } from "../test/fixtures/uuids.fixture";

const getTokenMock = vi.fn((): string | null => "token-1");

vi.mock("@/app/admin/shared/lib/adminAuth", () => ({
  getAdminBearerToken: () => getTokenMock(),
}));

import { useBookClassCatalog } from "./useBookClassCatalog";

describe("useBookClassCatalog", () => {
  beforeEach(() => {
    getTokenMock.mockReturnValue("token-1");
  });

  it("loads bookable events from the API", async () => {
    const { result } = renderHook(() => useBookClassCatalog(""));

    await waitFor(() => expect(result.current.eventsLoading).toBe(false));
    expect(result.current.hasBookableEvents).toBe(true);
    expect(result.current.events.map((e) => e.name)).toEqual(
      expect.arrayContaining(["Salsa Foundations", "Bachata Labs"]),
    );
    expect(result.current.context).toBeNull();
  });

  it("loads event context when eventId is set", async () => {
    const { result } = renderHook(() => useBookClassCatalog(FIXTURE_CLASS_EVENT_ID));

    await waitFor(() => expect(result.current.contextLoading).toBe(false));
    await waitFor(() => expect(result.current.context?.event.id).toBe(FIXTURE_CLASS_EVENT_ID));
    expect(result.current.context?.readiness?.isBookable).toBe(true);
  });

  it("sets an error when not signed in", async () => {
    getTokenMock.mockReturnValue(null);
    const { result } = renderHook(() => useBookClassCatalog(""));

    await waitFor(() => expect(result.current.eventsLoading).toBe(false));
    expect(result.current.error).toBe("Not signed in.");
    expect(result.current.hasBookableEvents).toBe(false);
  });

  it("surfaces catalog fetch errors", async () => {
    server.use(
      http.get("*/api/v1/upcoming-events/admin/bookable-class-events", () =>
        HttpResponse.json({ message: "Catalog down" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useBookClassCatalog(""));
    await waitFor(() => expect(result.current.error).toBe("Catalog down"));
    expect(result.current.eventsLoading).toBe(false);
  });

  it("surfaces context fetch errors", async () => {
    server.use(
      // Keep catalog pending so its success path cannot clear the context error.
      http.get("*/api/v1/upcoming-events/admin/bookable-class-events", () => new Promise(() => {})),
      http.get(
        "*/api/v1/upcoming-events/admin/events/:eventId/class-booking-context",
        () => HttpResponse.json({ message: "Missing event" }, { status: 404 }),
      ),
    );

    const { result } = renderHook(() => useBookClassCatalog(FIXTURE_CLASS_EVENT_ID));
    await waitFor(() => expect(result.current.error).toBe("Missing event"));
    expect(result.current.context).toBeNull();
  });

  it("clears context when eventId becomes empty", async () => {
    const { result, rerender } = renderHook(
      ({ eventId }: { eventId: string }) => useBookClassCatalog(eventId),
      { initialProps: { eventId: FIXTURE_CLASS_EVENT_ID } },
    );

    await waitFor(() => expect(result.current.context).not.toBeNull());

    rerender({ eventId: "" });
    await waitFor(() => expect(result.current.context).toBeNull());
  });

  it("reloadContext refreshes the selected event", async () => {
    let calls = 0;
    server.use(
      http.get(
        "*/api/v1/upcoming-events/admin/events/:eventId/class-booking-context",
        () => {
          calls += 1;
          return HttpResponse.json(
            makeBookClassEventContext({
              event: {
                id: FIXTURE_CLASS_EVENT_ID,
                slug: "salsa-foundations",
                name: calls === 1 ? "First" : "Second",
                timezone: "America/New_York",
              },
            }),
          );
        },
      ),
    );

    const { result } = renderHook(() => useBookClassCatalog(FIXTURE_CLASS_EVENT_ID));
    await waitFor(() => expect(result.current.context?.event.name).toBe("First"));

    result.current.reloadContext();
    await waitFor(() => expect(result.current.context?.event.name).toBe("Second"));
    expect(calls).toBe(2);
  });
});
