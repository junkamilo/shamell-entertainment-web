import { ensureUniqueEventSlug, slugifyEventName } from './event-slug.util';

describe('event-slug.util', () => {
  it('slugifyEventName normalizes and supports suffix', () => {
    expect(slugifyEventName('  Summer Night Gala!! ')).toBe(
      'summer-night-gala',
    );
    expect(slugifyEventName('Hi', 'abc123')).toBe('hi-abc123');
    expect(slugifyEventName('!!!')).toBe('event');
  });

  it('ensureUniqueEventSlug returns preferred when free', async () => {
    const prisma = {
      event: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };
    await expect(
      ensureUniqueEventSlug(prisma, 'Gala', undefined, 'private-galas'),
    ).resolves.toBe('private-galas');
  });

  it('ensureUniqueEventSlug allows preferred owned by excludeEventId', async () => {
    const prisma = {
      event: {
        findUnique: jest.fn().mockResolvedValue({ id: 'evt-1' }),
      },
    };
    await expect(
      ensureUniqueEventSlug(prisma, 'Gala', 'evt-1', 'private-galas'),
    ).resolves.toBe('private-galas');
  });

  it('ensureUniqueEventSlug appends random suffix when preferred taken', async () => {
    const prisma = {
      event: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ id: 'other' })
          .mockResolvedValueOnce(null),
      },
    };
    const slug = await ensureUniqueEventSlug(
      prisma,
      'Summer Gala',
      undefined,
      'summer-gala',
    );
    expect(slug.startsWith('summer-gala-')).toBe(true);
  });
});
