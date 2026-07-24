import { afterEach, describe, expect, it, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/server";
import {
  isReservationEventAdminNetworkError,
  RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE,
  reservationEventTemplateAdminFetch,
} from "./reservationEventTemplateAdminRequest";

const ROUTE = "*/api/v1/reservation-event-templates/admin";

describe("reservationEventTemplateAdminRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE", () => {
    it("is a helpful backend connectivity message", () => {
      expect(RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE).toContain("NEXT_PUBLIC_BACKEND_URL");
      expect(RESERVATION_EVENT_ADMIN_NETWORK_MESSAGE).toContain("localhost:3001");
    });
  });

  describe("isReservationEventAdminNetworkError", () => {
    it("returns true for Failed to fetch errors", () => {
      expect(isReservationEventAdminNetworkError(new Error("Failed to fetch"))).toBe(true);
    });

    it("returns true for non-Error values", () => {
      expect(isReservationEventAdminNetworkError("offline")).toBe(true);
      expect(isReservationEventAdminNetworkError(null)).toBe(true);
    });

    it("returns false for other Error messages", () => {
      expect(isReservationEventAdminNetworkError(new Error("HTTP 500"))).toBe(false);
    });
  });

  describe("reservationEventTemplateAdminFetch", () => {
    it("returns a response on success", async () => {
      server.use(http.get(ROUTE, () => HttpResponse.json([])));
      const response = await reservationEventTemplateAdminFetch("/admin");
      expect(response).not.toBeNull();
      expect(response?.ok).toBe(true);
    });

    it("passes init options to fetch", async () => {
      let auth: string | null = null;
      server.use(
        http.get(ROUTE, ({ request }) => {
          auth = request.headers.get("Authorization");
          return HttpResponse.json([]);
        }),
      );
      await reservationEventTemplateAdminFetch("/admin", {
        headers: { Authorization: "Bearer token-1" },
      });
      expect(auth).toBe("Bearer token-1");
    });

    it("returns null when fetch throws", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () => {
          throw new Error("Failed to fetch");
        }),
      );
      const response = await reservationEventTemplateAdminFetch("/admin");
      expect(response).toBeNull();
    });
  });
});
