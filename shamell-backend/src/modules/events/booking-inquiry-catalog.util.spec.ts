import {
  EventPublicSection,
  EventTypeCatalogChannel,
} from '@prisma/client';
import {
  adminEventTypesWhereForSection,
  bookingEligibleEventTypesWhere,
  bookingInquiryCatalogEventWhere,
  catalogChannelForPublicSection,
  eventTypeWhereForChannel,
  eventsWhereForPublicSection,
  onComingHubEventWhere,
} from './booking-inquiry-catalog.util';

describe('booking-inquiry-catalog.util', () => {
  describe('catalogChannelForPublicSection', () => {
    it('maps GENERAL → BOOKING and UPCOMING_EVENTS → UPCOMING_HUB', () => {
      expect(catalogChannelForPublicSection(EventPublicSection.GENERAL)).toBe(
        EventTypeCatalogChannel.BOOKING,
      );
      expect(
        catalogChannelForPublicSection(EventPublicSection.UPCOMING_EVENTS),
      ).toBe(EventTypeCatalogChannel.UPCOMING_HUB);
    });
  });

  describe('eventTypeWhereForChannel', () => {
    it('filters by catalogChannel', () => {
      expect(
        eventTypeWhereForChannel(EventTypeCatalogChannel.BOOKING),
      ).toEqual({ catalogChannel: EventTypeCatalogChannel.BOOKING });
      expect(
        eventTypeWhereForChannel(EventTypeCatalogChannel.UPCOMING_HUB),
      ).toEqual({ catalogChannel: EventTypeCatalogChannel.UPCOMING_HUB });
    });
  });

  describe('adminEventTypesWhereForSection(GENERAL)', () => {
    it('filters BOOKING channel', () => {
      expect(
        adminEventTypesWhereForSection(EventPublicSection.GENERAL),
      ).toEqual({ catalogChannel: EventTypeCatalogChannel.BOOKING });
    });
  });

  describe('adminEventTypesWhereForSection(UPCOMING_EVENTS)', () => {
    it('filters UPCOMING_HUB channel', () => {
      expect(
        adminEventTypesWhereForSection(EventPublicSection.UPCOMING_EVENTS),
      ).toEqual({ catalogChannel: EventTypeCatalogChannel.UPCOMING_HUB });
    });
  });

  describe('bookingEligibleEventTypesWhere', () => {
    it('requires active + BOOKING channel', () => {
      expect(bookingEligibleEventTypesWhere()).toEqual({
        isActive: true,
        catalogChannel: EventTypeCatalogChannel.BOOKING,
      });
    });
  });

  describe('bookingInquiryCatalogEventWhere', () => {
    it('requires GENERAL section and BOOKING event type channel only', () => {
      expect(bookingInquiryCatalogEventWhere).toEqual({
        isActive: true,
        publicSection: EventPublicSection.GENERAL,
        eventType: { catalogChannel: EventTypeCatalogChannel.BOOKING },
      });
    });
  });

  describe('onComingHubEventWhere', () => {
    it('matches UPCOMING_EVENTS section only (no heuristics)', () => {
      expect(onComingHubEventWhere).toEqual({
        publicSection: EventPublicSection.UPCOMING_EVENTS,
      });
    });
  });

  describe('eventsWhereForPublicSection', () => {
    it('pairs section with matching catalog channel', () => {
      expect(eventsWhereForPublicSection(EventPublicSection.GENERAL)).toEqual({
        publicSection: EventPublicSection.GENERAL,
        eventType: { catalogChannel: EventTypeCatalogChannel.BOOKING },
      });
      expect(
        eventsWhereForPublicSection(EventPublicSection.UPCOMING_EVENTS),
      ).toEqual({
        publicSection: EventPublicSection.UPCOMING_EVENTS,
        eventType: { catalogChannel: EventTypeCatalogChannel.UPCOMING_HUB },
      });
    });
  });
});
