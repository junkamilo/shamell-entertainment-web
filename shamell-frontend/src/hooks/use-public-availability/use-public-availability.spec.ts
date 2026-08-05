/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { server } from "@/test/server";
import { publicAvailabilityHandler } from "../test/mocks/handlers";
import { usePublicAvailability } from "./use-public-availability";

describe("usePublicAvailability", () => {
  beforeEach(() => {
    server.use(publicAvailabilityHandler());
  });

  it("loads public availability rules", async () => {
    const { result } = renderHook(() => usePublicAvailability(true, { polling: false }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.rules?.timeZone).toBe("America/New_York");
    expect(result.current.rules?.weekly).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it("does not fetch when disabled", async () => {
    const { result } = renderHook(() =>
      usePublicAvailability(false, { polling: false }),
    );
    expect(result.current.rules).toBeNull();
  });

  it("surfaces API errors", async () => {
    server.use(
      http.get("*/api/v1/availability/public", () =>
        HttpResponse.json({ message: "Unavailable" }, { status: 503 }),
      ),
    );
    const { result } = renderHook(() =>
      usePublicAvailability(true, { polling: false }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Unavailable");
    expect(result.current.rules).toBeNull();
  });
});
