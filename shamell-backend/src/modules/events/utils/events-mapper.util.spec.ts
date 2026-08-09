import {
  EventPublicSection,
  EventTypeCatalogChannel,
  EventTypeOccasionUsage,
  GalleryMediaType,
} from '@prisma/client';
import {
  effectiveGalleryMediaType,
  mapContactLine,
  mapContactLineFromEventType,
  mapEvent,
  mapEventType,
  mapEventTypeAdmin,
  mapOccasionGroups,
} from './events-mapper.util';

const NOW = new Date('2026-06-01T12:00:00.000Z');

describe('events-mapper.util', () => {
  describe('effectiveGalleryMediaType', () => {
    it('detects Cloudinary video path as VIDEO', () => {
      expect(
        effectiveGalleryMediaType(
          'https://res.cloudinary.com/demo/video/upload/v1/x.mp4',
          GalleryMediaType.IMAGE,
        ),
      ).toBe(GalleryMediaType.VIDEO);
    });

    it('falls back to provided mediaType', () => {
      expect(
        effectiveGalleryMediaType(
          'https://res.cloudinary.com/demo/image/upload/v1/x.jpg',
          GalleryMediaType.IMAGE,
        ),
      ).toBe(GalleryMediaType.IMAGE);
    });
  });

  describe('mapEvent', () => {
    it('maps core event + hero fields', () => {
      const mapped = mapEvent({
        id: 'evt-1',
        eventTypeId: 'et-1',
        description: 'Desc',
        items: ['A'],
        price: 100,
        isActive: true,
        showOnHome: true,
        publicSection: EventPublicSection.GENERAL,
        slug: null,
        experienceType: null,
        classVariant: null,
        createdAt: NOW,
        updatedAt: NOW,
        galleryPhotos: [
          {
            id: 'ph-1',
            imageUrl: 'https://res.cloudinary.com/demo/image/upload/v1/h.jpg',
            mediaType: GalleryMediaType.IMAGE,
          },
        ],
        eventType: {
          id: 'et-1',
          name: 'Wedding',
          contactInquiryCode: 'WEDDING',
          isActive: true,
          createdAt: NOW,
          updatedAt: NOW,
        },
      });

      expect(mapped.id).toBe('evt-1');
      expect(mapped.eventTypeName).toBe('Wedding');
      expect(mapped.price).toBe(100);
      expect(mapped.heroMediaType).toBe(GalleryMediaType.IMAGE);
      expect(mapped.catalogImages).toHaveLength(1);
    });
  });

  describe('mapEventType', () => {
    it('includes catalogChannel when present', () => {
      const mapped = mapEventType({
        id: 'et-1',
        name: 'Gala',
        catalogChannel: EventTypeCatalogChannel.BOOKING,
        contactInquiryCode: null,
        isActive: true,
        createdAt: NOW,
        updatedAt: NOW,
      });
      expect(mapped.catalogChannel).toBe(EventTypeCatalogChannel.BOOKING);
      expect(mapped.name).toBe('Gala');
    });
  });

  describe('contact-line smoke', () => {
    it('mapContactLine groups occasions and sets lineKind event', () => {
      const mapped = mapContactLine({
        id: 'evt-1',
        eventTypeId: 'et-1',
        description: 'Line',
        items: [],
        price: null,
        isActive: true,
        showOnHome: true,
        publicSection: EventPublicSection.GENERAL,
        createdAt: NOW,
        updatedAt: NOW,
        galleryPhotos: [],
        eventType: {
          id: 'et-1',
          name: 'Wedding',
          contactInquiryCode: 'WEDDING',
          isActive: true,
          occasionLinks: [
            {
              usage: EventTypeOccasionUsage.OCCASION_SINGLE,
              sortOrder: 0,
              occasionType: {
                id: 'occ-1',
                name: 'Birthday',
                isActive: true,
              },
            },
          ],
        },
      });
      expect(mapped.lineKind).toBe('event');
      expect(mapped.occasionSingle).toEqual([
        { id: 'occ-1', name: 'Birthday' },
      ]);
    });

    it('mapContactLineFromEventType uses event type id as line id', () => {
      const mapped = mapContactLineFromEventType({
        id: 'et-orphan',
        name: 'Orphan',
        contactInquiryCode: null,
        occasionLinks: [],
      });
      expect(mapped.lineKind).toBe('event_type');
      expect(mapped.id).toBe('et-orphan');
      expect(mapped.eventTypeId).toBe('et-orphan');
    });
  });

  describe('mapEventTypeAdmin + mapOccasionGroups', () => {
    it('exposes occasionAssignments', () => {
      const mapped = mapEventTypeAdmin({
        id: 'et-1',
        name: 'Wedding',
        contactInquiryCode: null,
        isActive: true,
        createdAt: NOW,
        updatedAt: NOW,
        occasionLinks: [
          {
            usage: EventTypeOccasionUsage.BESPOKE_ROLE,
            sortOrder: 1,
            occasionType: { id: 'occ-2', name: 'Host', isActive: true },
          },
        ],
      });
      expect(mapped.occasionAssignments).toHaveLength(1);
      expect(mapped.occasionBespokeRole[0]?.name).toBe('Host');
      expect(
        mapOccasionGroups([
          {
            usage: EventTypeOccasionUsage.BESPOKE_PROJECT,
            sortOrder: 0,
            occasionType: { id: 'o', name: 'P', isActive: true },
          },
        ]).occasionBespokeProject,
      ).toHaveLength(1);
    });
  });
});
