/** Formats an instant as a long calendar date in the event timezone (emails, Stripe labels). */
export function formatEventDateInZone(
  eventDate: Date,
  timeZone: string,
): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(eventDate);
}
