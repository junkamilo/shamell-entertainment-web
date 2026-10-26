import { describe, it, expect } from "vitest";
import { makeBookClassEventContext, makeBookClassFormSnapshot } from "@test/features/admin/agenda/book-class/support/fixtures/bookClass.fixture";
import { FIXTURE_CLASS_EVENT_ID, FIXTURE_SESSION_ID } from "@test/features/admin/agenda/book-class/support/fixtures/uuids.fixture";
import { createMockBookClassFormState } from "@test/features/admin/agenda/book-class/support/helpers/mockBookClassFormState";
import { fetchBookClassEventsCatalog } from "@/features/admin/agenda/book-class/services/fetchBookClassCatalog";

describe("book-class test environment", () => {
  it("exposes usable fixtures and form mock", () => {
    const context = makeBookClassEventContext();
    expect(context.event.id).toBe(FIXTURE_CLASS_EVENT_ID);
    expect(context.readiness?.isBookable).toBe(true);
    expect(context.sessions.length).toBeGreaterThan(0);

    const snapshot = makeBookClassFormSnapshot();
    expect(snapshot.selectedSessionIds.has(FIXTURE_SESSION_ID)).toBe(true);

    const form = createMockBookClassFormState({ customerName: "Ada" });
    expect(form.customerName).toBe("Ada");
    form.setCustomerEmail("ada@example.com");
    expect(form.setCustomerEmail).toHaveBeenCalledWith("ada@example.com");
  });

  it("serves bookable-class-events via MSW default handlers", async () => {
    const events = await fetchBookClassEventsCatalog("token-1");
    expect(events.map((e) => e.name).sort()).toEqual(["Bachata Labs", "Salsa Foundations"]);
  });
});
