import { GalleryMediaType, UpcomingExperienceType } from '@prisma/client';
import {
  effectiveGalleryMediaType,
  mapPublicHero,
  mapPublicSummary,
  mapSessionAdmin,
  mapSessionPublic,
  mapVenueConfig,
  sessionCalendarDateIso,
  sessionLabel,
} from './upcoming-events-mapper.util';

describe('upcoming-events-mapper.util', () => {
  describe('mapSessionPublic', () => {
    it('maps session capacity and section fields for public seats listing', () => {
      const startsAt = new Date('2026-08-10T18:00:00.000Z');
      const endsAt = new Date('2026-08-10T19:00:00.000Z');
      expect(
        mapSessionPublic({
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

    it('nulls optional section fields when section is missing', () => {
      const mapped = mapSessionPublic({
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

  describe('mapVenueConfig', () => {
    it('returns null reservationEventTemplate when template is absent', () => {
      const mapped = mapVenueConfig({
        id: 'cfg-1',
        eventId: 'evt-1',
        clientEnabled: true,
        promoTitle: null,
        promoDescription: null,
        promoImageUrl: null,
        reservationEventDate: null,
        reservationOpensAt: null,
        reservationClosesAt: null,
        reservationEventLabel: 'Gala Night',
        reservationTimezone: 'America/New_York',
        floorLayoutId: 'layout-1',
        reservationEventTemplate: null,
      });
      expect(mapped.reservationEventTemplate).toBeNull();
      expect(mapped.reservationEventLabel).toBe('Gala Night');
      expect(mapped.floorLayoutId).toBe('layout-1');
    });
  });

  describe('mapPublicHero', () => {
    it('returns null hero when gallery is empty', () => {
      expect(mapPublicHero({ galleryPhotos: [] })).toEqual({
        heroImageUrl: null,
        heroMediaType: null,
      });
    });

    it('detects VIDEO from Cloudinary video URL', () => {
      expect(
        mapPublicHero({
          galleryPhotos: [
            {
              imageUrl:
                'https://res.cloudinary.com/demo/video/upload/v1/sample.mp4',
              mediaType: GalleryMediaType.IMAGE,
            },
          ],
        }),
      ).toEqual({
        heroImageUrl:
          'https://res.cloudinary.com/demo/video/upload/v1/sample.mp4',
        heroMediaType: 'VIDEO',
      });
    });

    it('defaults to IMAGE when URL is not video', () => {
      expect(
        mapPublicHero({
          galleryPhotos: [
            {
              imageUrl: 'https://cdn.example.com/poster.jpg',
              mediaType: GalleryMediaType.IMAGE,
            },
          ],
        }),
      ).toEqual({
        heroImageUrl: 'https://cdn.example.com/poster.jpg',
        heroMediaType: 'IMAGE',
      });
    });
  });

  describe('effectiveGalleryMediaType', () => {
    it('infers VIDEO from file extension even when mediaType is IMAGE', () => {
      expect(
        effectiveGalleryMediaType('https://cdn.example.com/clip.webm', null),
      ).toBe(GalleryMediaType.VIDEO);
    });
  });

  describe('sessionLabel', () => {
    it('includes section label and time range when section is present', () => {
      const label = sessionLabel({
        startsAt: new Date('2026-08-10T22:00:00.000Z'),
        endsAt: new Date('2026-08-10T23:00:00.000Z'),
        timezone: 'America/New_York',
        section: {
          label: 'Intermediate',
          startTime: '18:00',
          endTime: '19:00',
        },
      });
      expect(label).toContain('Intermediate');
      expect(label).toContain('18:00?19:00');
      expect(label).toContain(' ? ');
    });

    it('returns date-only label when section is missing', () => {
      const label = sessionLabel({
        startsAt: new Date('2026-08-10T22:00:00.000Z'),
        endsAt: new Date('2026-08-10T23:00:00.000Z'),
        timezone: 'America/New_York',
      });
      expect(label).not.toContain(' ? ');
    });
  });

  describe('sessionCalendarDateIso', () => {
    it('formats calendar date in the given timezone', () => {
      expect(
        sessionCalendarDateIso(
          new Date('2026-08-11T03:00:00.000Z'),
          'America/New_York',
        ),
      ).toBe('2026-08-10');
    });
  });

  describe('mapPublicSummary', () => {
    it('coerces price to number and preserves event metadata', () => {
      expect(
        mapPublicSummary({
          id: 'evt-1',
          slug: 'summer-gala',
          description: 'An evening event',
          items: ['Dinner', 'Show'],
          price: '125.50',
          experienceType: UpcomingExperienceType.CLASSES,
          classVariant: 'GROUP',
          eventType: { name: 'Summer Gala' },
        }),
      ).toEqual({
        id: 'evt-1',
        slug: 'summer-gala',
        eventTypeName: 'Summer Gala',
        description: 'An evening event',
        items: ['Dinner', 'Show'],
        price: 125.5,
        experienceType: UpcomingExperienceType.CLASSES,
        classVariant: 'GROUP',
      });
    });
  });

  describe('mapSessionAdmin', () => {
    it('extends public session mapping with admin fields', () => {
      const startsAt = new Date('2026-08-10T18:00:00.000Z');
      const endsAt = new Date('2026-08-10T19:00:00.000Z');
      expect(
        mapSessionAdmin({
          id: 'sess-admin',
          eventId: 'evt-1',
          startsAt,
          endsAt,
          timezone: 'UTC',
          capacity: 10,
          price: 50,
          currency: 'usd',
          isActive: true,
          sortOrder: 2,
        }),
      ).toEqual({
        ...mapSessionPublic({
          id: 'sess-admin',
          startsAt,
          endsAt,
          timezone: 'UTC',
          capacity: 10,
          price: 50,
          currency: 'usd',
        }),
        isActive: true,
        sortOrder: 2,
      });
    });
  });
});
