import { describe, expect, it } from '@jest/globals';
import {
  buildInclusionSummary,
  formatArrivalLabel,
  mapActivityAdmin,
  mapActivityPublic,
  mapPackagePublic,
  validateArrivalWindow,
} from './fixed-event-package.mapper';

describe('fixed-event-package.mapper', () => {
  it('validateArrivalWindow allows overnight and rejects equal times', () => {
    expect(validateArrivalWindow('18:00', '20:00')).toBeNull();
    expect(validateArrivalWindow('22:00', '01:00')).toBeNull();
    expect(validateArrivalWindow('18:00', null)).toBeNull();
    expect(validateArrivalWindow('18:00', '18:00')).toMatch(/differ/i);
    expect(validateArrivalWindow('99:00', '20:00')).toMatch(/start/i);
  });

  it('formatArrivalLabel single time', () => {
    const start = new Date(Date.UTC(1970, 0, 1, 18, 0));
    expect(formatArrivalLabel(start, null)).toBe('6:00 PM');
  });

  it('mapActivityAdmin includes isActive', () => {
    expect(
      mapActivityAdmin({
        id: 'a1',
        title: 'Workshop',
        description: 'Learn',
        accentColor: null,
        displayOrder: 0,
        isActive: false,
      }).isActive,
    ).toBe(false);
    expect(
      mapActivityAdmin({
        id: 'a2',
        title: 'Show',
        description: 'Enjoy',
        accentColor: null,
        displayOrder: 1,
      }).isActive,
    ).toBe(true);
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
