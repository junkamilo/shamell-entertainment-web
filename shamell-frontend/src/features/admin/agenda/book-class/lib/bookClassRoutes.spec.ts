import { describe, it, expect } from "vitest";
import { BOOK_CLASS_SETUP_PATH } from "./bookClassRoutes";
import { ON_COMING_EVENTS_ADMIN_PATH } from "@/lib/onComingEventsRoutes";

describe("bookClassRoutes", () => {
  it("re-exports the On Coming Events admin path for setup", () => {
    expect(BOOK_CLASS_SETUP_PATH).toBe(ON_COMING_EVENTS_ADMIN_PATH);
    expect(BOOK_CLASS_SETUP_PATH).toBe("/admin/on-coming-events");
  });
});
