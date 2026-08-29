/** @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/utils/renderWithProviders";

let search = new URLSearchParams("session_id=cs_test_session");

vi.mock("next/navigation", () => ({
  useSearchParams: () => search,
}));

vi.mock("@/components/shared", () => ({
  SiteHeader: () => <header data-testid="site-header" />,
  Footer: () => <footer data-testid="site-footer" />,
}));

vi.mock("@/lib/publicApiBaseUrl", () => ({
  getPublicApiBaseUrl: () => "https://api.example.test",
}));

vi.mock("./ClassPaymentConfirmationPanel", () => ({
  ClassPaymentConfirmationFallback: () => <div data-testid="fallback" />,
  ClassPaymentConfirmationPanel: ({
    status,
    paidTitle,
    sessionRows,
    onRefresh,
  }: {
    status: string;
    paidTitle: string;
    sessionRows: { sessionLabel: string }[];
    onRefresh?: () => void;
  }) => (
    <div>
      <h1>{paidTitle}</h1>
      <p data-testid="status">{status}</p>
      {sessionRows.map((row) => (
        <p key={row.sessionLabel}>{row.sessionLabel}</p>
      ))}
      {onRefresh ? (
        <button type="button" onClick={onRefresh}>
          refresh
        </button>
      ) : null}
    </div>
  ),
}));

import { ClassPackageReturnClient } from "./ClassPackageReturnClient";

describe("ClassPackageReturnClient", () => {
  beforeEach(() => {
    search = new URLSearchParams("session_id=cs_test_session");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            stripeStatus: "complete",
            purchaseKind: "package",
            enrollment: {
              status: "PAID",
              sessions: [
                { sessionLabel: "Mon 7pm Beginner", confirmationReference: "ABC123" },
                { sessionLabel: "Tue 7pm", confirmationReference: 99 },
                { nope: true },
                null,
                { sessionLabel: 1 },
              ],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("shows package confirmation with valid session rows", async () => {
    renderWithProviders(<ClassPackageReturnClient />);
    expect(await screen.findByRole("heading", { name: "Package confirmed" })).toBeInTheDocument();
    expect(screen.getByText("Mon 7pm Beginner")).toBeInTheDocument();
  });

  it("uses day-bundle copy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ stripeStatus: "complete", purchaseKind: "day_bundle" }),
          { status: 200 },
        ),
      ),
    );
    renderWithProviders(<ClassPackageReturnClient />);
    expect(await screen.findByRole("heading", { name: "Classes confirmed" })).toBeInTheDocument();
  });

  it("uses session-cart copy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({ stripeStatus: "complete", purchaseKind: "session_cart" }),
          { status: 200 },
        ),
      ),
    );
    renderWithProviders(<ClassPackageReturnClient />);
    expect(await screen.findByRole("heading", { name: "Classes confirmed" })).toBeInTheDocument();
  });

  it("treats package:true as a package purchase", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ stripeStatus: "complete", package: true }), {
          status: 200,
        }),
      ),
    );
    renderWithProviders(<ClassPackageReturnClient />);
    expect(await screen.findByRole("heading", { name: "Package confirmed" })).toBeInTheDocument();
  });

  it("shows a generic booking title when kind is unknown", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ stripeStatus: "complete" }), { status: 200 }),
      ),
    );
    renderWithProviders(<ClassPackageReturnClient />);
    expect(await screen.findByRole("heading", { name: "Booking confirmed" })).toBeInTheDocument();
  });

  it("errors without a session id", async () => {
    search = new URLSearchParams("");
    renderWithProviders(<ClassPackageReturnClient />);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("error"));
  });

  it("errors on invalid JSON payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 200 })),
    );
    renderWithProviders(<ClassPackageReturnClient />);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("error"));
  });

  it("marks expired Stripe sessions as errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ stripeStatus: "expired" }), { status: 200 }),
      ),
    );
    renderWithProviders(<ClassPackageReturnClient />);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("error"));
  });

  it("errors when the status request is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("fail", { status: 500 })),
    );
    renderWithProviders(<ClassPackageReturnClient />);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("error"));
  });

  it("treats enrollment PAID as paid even when Stripe is still open", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            stripeStatus: "open",
            enrollment: { status: "PAID", sessions: "nope" },
          }),
          { status: 200 },
        ),
      ),
    );
    renderWithProviders(<ClassPackageReturnClient />);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("paid"));
  });

  it("stops polling after eight pending checks", async () => {
    const queued: Array<() => void> = [];
    const realSetTimeout = globalThis.setTimeout;
    vi.stubGlobal("setTimeout", ((fn: TimerHandler, ms?: number, ...args: unknown[]) => {
      if (ms === 3000 && typeof fn === "function") {
        queued.push(() => (fn as () => void)());
        return 1;
      }
      return realSetTimeout(fn, ms, ...args);
    }) as typeof setTimeout);
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ stripeStatus: "open" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    renderWithProviders(<ClassPackageReturnClient />);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("pending"));
    for (let i = 0; i < 8; i += 1) {
      const before = fetchMock.mock.calls.length;
      expect(queued.length).toBeGreaterThan(0);
      await act(async () => {
        queued.shift()?.();
        await Promise.resolve();
      });
      await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(before));
    }
    const afterEight = fetchMock.mock.calls.length;
    expect(queued.length).toBe(0);
    expect(fetchMock.mock.calls.length).toBe(afterEight);
  });

  it("polls pending payments and refreshes", async () => {
    const user = userEvent.setup();
    const queued: Array<() => void> = [];
    const realSetTimeout = globalThis.setTimeout;
    vi.stubGlobal("setTimeout", ((fn: TimerHandler, ms?: number, ...args: unknown[]) => {
      if (ms === 3000 && typeof fn === "function") {
        queued.push(() => (fn as () => void)());
        return 1;
      }
      return realSetTimeout(fn, ms, ...args);
    }) as typeof setTimeout);
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        return new Response(
          JSON.stringify({
            stripeStatus: calls > 1 ? "complete" : "open",
            enrollment: { status: calls > 1 ? "PAID" : "PENDING" },
          }),
          { status: 200 },
        );
      }),
    );
    renderWithProviders(<ClassPackageReturnClient />);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("pending"));
    await act(async () => {
      queued.shift()?.();
      await Promise.resolve();
    });
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("paid"));
    await user.click(screen.getByRole("button", { name: "refresh" }));
    expect(calls).toBeGreaterThan(2);
  });
});
