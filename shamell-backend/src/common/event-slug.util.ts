/** Build a URL-safe slug from a display name, with optional suffix for uniqueness. */
export function slugifyEventName(name: string, suffix?: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  const safe = base.length > 0 ? base : 'event';
  return suffix ? `${safe}-${suffix}` : safe;
}

export async function ensureUniqueEventSlug(
  prisma: {
    event: {
      findUnique: (args: {
        where: { slug: string };
        select: { id: true };
      }) => Promise<{ id: string } | null>;
    };
  },
  name: string,
  excludeEventId?: string,
): Promise<string> {
  const suffix = crypto.randomUUID().slice(0, 8);
  let candidate = slugifyEventName(name, suffix);
  let attempt = 0;
  while (attempt < 10) {
    const taken = await prisma.event.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken || (excludeEventId && taken.id === excludeEventId)) {
      return candidate;
    }
    attempt += 1;
    candidate = slugifyEventName(name, crypto.randomUUID().slice(0, 8));
  }
  return slugifyEventName(name, crypto.randomUUID().slice(0, 12));
}
