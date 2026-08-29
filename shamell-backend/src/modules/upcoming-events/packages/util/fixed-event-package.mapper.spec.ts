import { describe, expect, it } from '@jest/globals';
import {
  buildInclusionSummary,
  formatArrivalLabel,
  mapActivityPublic,
  mapPackagePublic,
} from './fixed-event-package.mapper';

describe('fixed-event-package.mapper', () => {
  it('formatArrivalLabel single time', () => {
    const start = new Date(Date.UTC(1970, 0, 1, 18, 0));
    expect(formatArrivalLabel(start, null)).toBe('6:00 PM');
  });

  it('buildInclusionSummary joins titles', () => {
    const summary = buildInclusionSummary([
      {
        displayOrder: 0,
        activity: {
          id: 'a',
          title: 'Workshop',
          description: null,
          accentColor: null,
          displayOrder: 0,
        },
      },
      {
        displayOrder: 1,
        activity: {
          id: 'b',
          title: 'Show',
          description: null,
          accentColor: null,
          displayOrder: 1,
        },
      },
    ]);
    expect(summary).toBe('Workshop + Show');
  });

  it('mapActivityPublic defaults showText to true', () => {
    expect(
      mapActivityPublic({
        id: 'a1',
        title: 'Workshop',
        description: 'Learn steps',
        mediaUrl: null,
        mediaType: null,
        accentColor: null,
        displayOrder: 0,
      }).showText,
    ).toBe(true);

    expect(
      mapActivityPublic({
        id: 'a2',
        title: 'Show',
        description: 'Enjoy',
        mediaUrl: 'https://cdn.example/x.jpg',
        mediaType: 'IMAGE',
        accentColor: null,
        showText: false,
        displayOrder: 1,
      }).showText,
    ).toBe(false);
  });

  it('mapActivityPublic falls back to showing text when hide-text has no media', () => {
    expect(
      mapActivityPublic({
        id: 'a3',
        title: 'Show',
        description: 'Enjoy',
        mediaUrl: null,
        mediaType: null,
        accentColor: null,
        showText: false,
        displayOrder: 0,
      }).showText,
    ).toBe(true);
  });

  it('mapPackagePublic marks sold out', () => {
    const pkg = mapPackagePublic(
      {
        id: 'p1',
        title: 'Full',
        description: null,
        badge: null,
        priceCents: 4000,
        capacity: 30,
        arrivalStartTime: new Date(Date.UTC(1970, 0, 1, 18, 0)),
        arrivalEndTime: null,
        displayOrder: 0,
        isActive: true,
        activityLinks: [],
      },
      { blocking: 30, remaining: 0, sold: 30 },
    );
    expect(pkg.soldOut).toBe(true);
    expect(pkg.price).toBe(40);
  });
});
