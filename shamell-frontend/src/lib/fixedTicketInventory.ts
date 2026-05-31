/** Public copy for fixed-ticket inventory (capacity always comes from the API / DB). */
export function fixedTicketInventoryLabel(
  fixedTicketCapacity: number,
  ticketsRemaining: number,
  ticketsSold?: number,
): string {
  const sold = ticketsSold ?? Math.max(0, fixedTicketCapacity - ticketsRemaining);
  return `${fixedTicketCapacity} tickets for sale · ${sold} sold · ${ticketsRemaining} available`;
}

export function parseApiInt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === "string" && value.trim()) {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}
