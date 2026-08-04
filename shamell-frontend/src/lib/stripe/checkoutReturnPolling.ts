export type CheckoutPollOutcome = "paid" | "expired" | "pending" | "error";

export type CheckoutPollResult<T> = {
  data: T | null;
  outcome: CheckoutPollOutcome;
};

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (!signal) return;
    if (signal.aborted) {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export async function pollCheckoutStatus<T>({
  fetchStatus,
  isPaid,
  isExpired,
  maxAttempts = 8,
  intervalMs = 2000,
  signal,
}: {
  fetchStatus: () => Promise<T | null>;
  isPaid: (data: T) => boolean;
  isExpired: (data: T) => boolean;
  maxAttempts?: number;
  intervalMs?: number;
  signal?: AbortSignal;
}): Promise<CheckoutPollResult<T>> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (signal?.aborted) {
      return { data: null, outcome: "error" };
    }

    const data = await fetchStatus();
    if (!data) {
      if (attempt === maxAttempts - 1) {
        return { data: null, outcome: "error" };
      }
    } else {
      if (isPaid(data)) {
        return { data, outcome: "paid" };
      }
      if (isExpired(data)) {
        return { data, outcome: "expired" };
      }
      if (attempt < maxAttempts - 1) {
        await sleep(intervalMs, signal);
      } else {
        return { data, outcome: "pending" };
      }
    }
  }

  return { data: null, outcome: "error" };
}
