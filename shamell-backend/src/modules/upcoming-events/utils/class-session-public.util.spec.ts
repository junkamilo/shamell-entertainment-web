import { mapClassSessionPublic } from './class-session-public.util';

describe('mapClassSessionPublic', () => {
  it('maps session and optional section fields', () => {
    const startsAt = new Date('2026-08-10T18:00:00.000Z');
    const endsAt = new Date('2026-08-10T19:00:00.000Z');
    expect(
      mapClassSessionPublic({
        id: 'sess-1',
        startsAt,
        endsAt,
        timezone: 'America/New_York',
        capacity: 12,
        price: '45.00',
        currency: 'usd',
        weekday: 1,
        sectionId: 'sec-1',
        section: {
          label: 'Beginner',
          startTime: '18:00',
          endTime: '19:00',
        },
      }),
    ).toEqual({
      id: 'sess-1',
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      timezone: 'America/New_York',
      capacity: 12,
      price: 45,
      currency: 'usd',
      weekday: 1,
      sectionId: 'sec-1',
      sectionLabel: 'Beginner',
      sectionStartTime: '18:00',
      sectionEndTime: '19:00',
    });
  });

  it('nulls section fields when section missing', () => {
    const mapped = mapClassSessionPublic({
      id: 'sess-2',
      startsAt: new Date('2026-08-10T18:00:00.000Z'),
      endsAt: new Date('2026-08-10T19:00:00.000Z'),
      timezone: 'UTC',
      capacity: 8,
      price: 30,
      currency: 'usd',
    });
    expect(mapped.sectionId).toBeNull();
    expect(mapped.sectionLabel).toBeNull();
    expect(mapped.weekday).toBeNull();
  });
});
