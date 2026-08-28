import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pollCheckoutStatus } from "./checkoutReturnPolling";

describe("pollCheckoutStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("returns paid on the first successful fetch", async () => {
    const resultPromise = pollCheckoutStatus({
      fetchStatus: async () => ({ status: "paid" }),
      isPaid: (d) => d.status === "paid",
      isExpired: () => false,
      maxAttempts: 3,
      intervalMs: 100,
    });
    await expect(resultPromise).resolves.toEqual({
      data: { status: "paid" },
      outcome: "paid",
    });
  });

  it("returns expired when isExpired matches", async () => {
    await expect(
      pollCheckoutStatus({
        fetchStatus: async () => ({ status: "expired" }),
        isPaid: () => false,
        isExpired: (d) => d.status === "expired",
        maxAttempts: 2,
        intervalMs: 50,
      }),
    ).resolves.toEqual({
      data: { status: "expired" },
      outcome: "expired",
    });
  });

  it("retries after null mid-loop then pays", async () => {
    const fetchStatus = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ status: "paid" });

    const resultPromise = pollCheckoutStatus({
      fetchStatus,
      isPaid: (d) => d.status === "paid",
      isExpired: () => false,
      maxAttempts: 3,
      intervalMs: 100,
    });

    // First attempt: null, no sleep (only sleeps when data is present and not terminal)
    // Looking at code: if (!data) { if last -> error; } else { ... sleep }
    // So null mid-loop does NOT sleep - it continues immediately to next attempt!
    await expect(resultPromise).resolves.toEqual({
      data: { status: "paid" },
      outcome: "paid",
    });
    expect(fetchStatus).toHaveBeenCalledTimes(2);
  });

  it("returns error when last attempt is null", async () => {
    await expect(
      pollCheckoutStatus({
        fetchStatus: async () => null,
        isPaid: () => false,
        isExpired: () => false,
        maxAttempts: 2,
        intervalMs: 50,
      }),
    ).resolves.toEqual({ data: null, outcome: "error" });
  });

  it("sleeps between pending attempts and returns pending on last", async () => {
    const fetchStatus = vi.fn().mockResolvedValue({ status: "open" });

    const resultPromise = pollCheckoutStatus({
      fetchStatus,
      isPaid: () => false,
      isExpired: () => false,
      maxAttempts: 2,
      intervalMs: 100,
    });

    await vi.advanceTimersByTimeAsync(100);
    await expect(resultPromise).resolves.toEqual({
      data: { status: "open" },
      outcome: "pending",
    });
    expect(fetchStatus).toHaveBeenCalledTimes(2);
  });

  it("returns error when signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      pollCheckoutStatus({
        fetchStatus: async () => ({ status: "open" }),
        isPaid: () => false,
        isExpired: () => false,
        maxAttempts: 3,
        intervalMs: 50,
        signal: controller.signal,
      }),
    ).resolves.toEqual({ data: null, outcome: "error" });
  });

  it("rejects when aborted during sleep between attempts", async () => {
    const controller = new AbortController();
    const fetchStatus = vi.fn().mockResolvedValue({ status: "open" });

    const resultPromise = pollCheckoutStatus({
      fetchStatus,
      isPaid: () => false,
      isExpired: () => false,
      maxAttempts: 3,
      intervalMs: 500,
      signal: controller.signal,
    });

    // First attempt returns open → starts sleep
    await Promise.resolve();
    controller.abort();
    await expect(resultPromise).rejects.toMatchObject({ name: "AbortError" });
  });

  it("sleeps without signal when continuing after non-terminal data", async () => {
    const fetchStatus = vi
      .fn()
      .mockResolvedValueOnce({ status: "open" })
      .mockResolvedValueOnce({ status: "paid" });

    const resultPromise = pollCheckoutStatus({
      fetchStatus,
      isPaid: (d) => d.status === "paid",
      isExpired: () => false,
      maxAttempts: 3,
      intervalMs: 200,
    });

    await vi.advanceTimersByTimeAsync(200);
    await expect(resultPromise).resolves.toEqual({
      data: { status: "paid" },
      outcome: "paid",
    });
  });

  it("rejects when sleep starts with an already-aborted signal", async () => {
    const controller = new AbortController();
    await expect(
      pollCheckoutStatus({
        fetchStatus: async () => {
          controller.abort();
          return { status: "open" };
        },
        isPaid: () => false,
        isExpired: () => false,
        maxAttempts: 3,
        intervalMs: 100,
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: "AbortError" });
  });

  it("returns error when maxAttempts is zero", async () => {
    await expect(
      pollCheckoutStatus({
        fetchStatus: async () => ({ status: "open" }),
        isPaid: () => false,
        isExpired: () => false,
        maxAttempts: 0,
        intervalMs: 50,
      }),
    ).resolves.toEqual({ data: null, outcome: "error" });
  });
});
