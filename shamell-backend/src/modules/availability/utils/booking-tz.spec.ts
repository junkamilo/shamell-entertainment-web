import {
  parseHHMM,
  utcInstantForWallClock,
  zonedWallClock,
} from './booking-tz';

describe('booking-tz', () => {
  it('parseHHMM converts HH:mm to minutes', () => {
    expect(parseHHMM('09:30', 'startTime')).toBe(9 * 60 + 30);
  });

  it('parseHHMM rejects invalid format', () => {
    expect(() => parseHHMM('9:30', 'startTime')).toThrow();
  });

  it('zonedWallClock returns weekday for America/New_York', () => {
    // 2026-07-15 is a Wednesday UTC noon
    const wall = zonedWallClock(
      new Date('2026-07-15T16:00:00.000Z'),
      'America/New_York',
    );
    expect(wall.dateISO).toBe('2026-07-15');
    expect(wall.weekday).toBe(3);
  });

  it('utcInstantForWallClock roundtrips wall clock minutes', () => {
    const tz = 'America/New_York';
    const dateISO = '2026-07-15';
    const minutes = 10 * 60;
    const instant = utcInstantForWallClock(dateISO, minutes, tz);
    const wall = zonedWallClock(instant, tz);
    expect(wall.dateISO).toBe(dateISO);
    expect(wall.minutesSinceMidnight).toBe(minutes);
  });
});
