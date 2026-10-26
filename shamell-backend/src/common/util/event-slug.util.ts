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

type PrismaSlugClient = {
  event: {
    findUnique: (args: {
      where: { slug: string };
      select: { id: true };
    }) => Promise<{ id: string } | null>;
  };
};

/**
 * Prefer an exact slug when free; otherwise append a short random suffix.
 * Pass `preferredSlug` for stable marketing URLs (e.g. private-galas).
 */
export async function ensureUniqueEventSlug(
  prisma: PrismaSlugClient,
  name: string,
  excludeEventId?: string,
  preferredSlug?: string,
): Promise<string> {
  const preferred = preferredSlug?.trim().toLowerCase();
  if (preferred) {
    const candidate = slugifyEventName(preferred);
    const taken = await prisma.event.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!taken || (excludeEventId && taken.id === excludeEventId)) {
      return candidate;
    }
  }

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
