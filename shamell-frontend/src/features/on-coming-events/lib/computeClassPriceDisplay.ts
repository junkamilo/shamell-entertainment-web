/** Minimum session price in USD for public hero display. */
export type ClassPriceRange = {
  from: number;
  to: number;
};

type SessionLike = { price: number };

/**
 * Resolves a price range for recurring class events from active session prices,
 * falling back to the event base price when no sessions are listed yet.
 */
export function computeClassPriceDisplay(
  sessions: SessionLike[],
  eventBasePrice: number | null | undefined,
): ClassPriceRange | null {
  const sessionPrices = sessions
    .map((s) => s.price)
    .filter((p) => typeof p === "number" && Number.isFinite(p) && p > 0);

  if (sessionPrices.length > 0) {
    return {
      from: Math.min(...sessionPrices),
      to: Math.max(...sessionPrices),
    };
  }

  if (
    eventBasePrice != null &&
    typeof eventBasePrice === "number" &&
    Number.isFinite(eventBasePrice) &&
    eventBasePrice > 0
  ) {
    return { from: eventBasePrice, to: eventBasePrice };
  }

  return null;
}

export function formatClassPriceHeroLabel(range: ClassPriceRange): string {
  if (range.from === range.to) {
    return formatUsd(range.from);
  }
  return `${formatUsd(range.from)} – ${formatUsd(range.to)}`;
}

export function formatClassPriceHeroPrefix(range: ClassPriceRange): string {
  if (range.from === range.to) {
    return "";
  }
  return "From ";
}

function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

export function classPriceHeroAriaLabel(range: ClassPriceRange): string {
  if (range.from === range.to) {
    return `Price ${formatUsd(range.from)} USD`;
  }
  return `Price from ${formatUsd(range.from)} to ${formatUsd(range.to)} USD`;
}
