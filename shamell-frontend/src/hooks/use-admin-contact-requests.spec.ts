/** @vitest-environment jsdom */

import { describe, it, expect, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { ADMIN_ACCESS_TOKEN_KEY } from "@/lib/admin/session";
import { server } from "@/test/server";
import { contactListHandler } from "./test/mocks/handlers";
import {
  makeContactRequest,
  makeContactRequestsPayload,
} from "./test/fixtures/hooks.fixture";
import {
  FIXTURE_CONTACT_ID,
  FIXTURE_CONTACT_ID_2,
} from "./test/fixtures/uuids.fixture";
import { useAdminContactRequests } from "./use-admin-contact-requests";

describe("useAdminContactRequests", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, "token-1");
    server.use(contactListHandler());
  });

  it("loads contact requests when token is present", async () => {
    const { result } = renderHook(() => useAdminContactRequests(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requests[0]?.id).toBe(FIXTURE_CONTACT_ID);
  });

  it("clears when token is missing", async () => {
    localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    const { result } = renderHook(() => useAdminContactRequests(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.requests).toEqual([]);
  });

  it("updates status and removes a request", async () => {
    server.use(
      contactListHandler(
        makeContactRequestsPayload([
          makeContactRequest({ id: FIXTURE_CONTACT_ID }),
          makeContactRequest({
            id: FIXTURE_CONTACT_ID_2,
            fullName: "Guest B",
            email: "b@example.com",
          }),
        ]),
      ),
    );
    const { result } = renderHook(() => useAdminContactRequests(true));
    await waitFor(() => expect(result.current.requests).toHaveLength(2));

    await act(async () => {
      await result.current.setStatus(FIXTURE_CONTACT_ID, "RESERVED");
    });
    expect(
      result.current.requests.find((r) => r.id === FIXTURE_CONTACT_ID)?.status,
    ).toBe("RESERVED");

    await act(async () => {
      await result.current.remove(FIXTURE_CONTACT_ID_2);
    });
    expect(result.current.requests.map((r) => r.id)).toEqual([
      FIXTURE_CONTACT_ID,
    ]);
  });

  it("surfaces list errors", async () => {
    server.use(
      http.get("*/api/v1/contact", () =>
        HttpResponse.json({ message: "Nope" }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useAdminContactRequests(true));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Nope");
  });
});
