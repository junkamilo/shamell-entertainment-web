import { EventTypeCatalogChannel } from '@prisma/client';
import type { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing/prisma-mock';
import {
  bookingInquiryFixtureIds,
  makeSanitizedInquiryDetails,
} from '../__mocks__/booking-inquiry.fixtures';
import {
  bookingDetailsForPublicInquiry,
  parseInquiryServiceIds,
  resolvePrimaryServiceIdForInquiry,
} from './contact-inquiry-booking.util';

describe('contact-inquiry-booking.util', () => {
  const { SERVICE_A, SERVICE_B, EVENT_ID, EVENT_TYPE_ID } =
    bookingInquiryFixtureIds;

  describe('parseInquiryServiceIds', () => {
    it('returns empty for missing serviceIds', () => {
      expect(parseInquiryServiceIds(undefined)).toEqual([]);
      expect(parseInquiryServiceIds(makeSanitizedInquiryDetails())).toEqual([]);
    });

    it('dedupes and preserves order', () => {
      expect(
        parseInquiryServiceIds(
          makeSanitizedInquiryDetails({
            serviceIds: [SERVICE_A, SERVICE_A, SERVICE_B, 'not-a-uuid'],
          }),
        ),
      ).toEqual([SERVICE_A, SERVICE_B]);
    });
  });

  describe('resolvePrimaryServiceIdForInquiry', () => {
    it('prefers first serviceId from details', async () => {
      const prismaMock = createPrismaMock();
      const id = await resolvePrimaryServiceIdForInquiry(
        prismaMock as unknown as PrismaService,
        makeSanitizedInquiryDetails({
          serviceIds: [SERVICE_B, SERVICE_A],
        }),
      );
      expect(id).toBe(SERVICE_B);
      expect(prismaMock.service.findFirst.mock.calls).toHaveLength(0);
    });

    it('resolves from source catalog service when no serviceIds', async () => {
      const prismaMock = createPrismaMock({
        service: {
          findFirst: jest.fn().mockResolvedValue({ id: SERVICE_A }),
        },
      });

      const id = await resolvePrimaryServiceIdForInquiry(
        prismaMock as unknown as PrismaService,
        makeSanitizedInquiryDetails({
          sourceCatalogKind: 'service',
          sourceCatalogId: SERVICE_A,
        }),
      );
      expect(id).toBe(SERVICE_A);
      expect(prismaMock.service.findFirst.mock.calls.length).toBeGreaterThan(0);
    });

    it('falls back to serviceType inquiry code', async () => {
      const prismaMock = createPrismaMock({
        service: {
          findFirst: jest.fn().mockResolvedValue({ id: SERVICE_A }),
        },
      });

      const id = await resolvePrimaryServiceIdForInquiry(
        prismaMock as unknown as PrismaService,
        makeSanitizedInquiryDetails(),
        'PRIVATE_GALA',
      );
      expect(id).toBe(SERVICE_A);
    });

    it('resolves via booking eventType contactInquiryCode', async () => {
      const prismaMock = createPrismaMock({
        eventType: {
          findUnique: jest.fn().mockResolvedValue({
            contactInquiryCode: 'PRIVATE_GALA',
            catalogChannel: EventTypeCatalogChannel.BOOKING,
          }),
        },
        service: {
          findFirst: jest.fn().mockResolvedValue({ id: SERVICE_A }),
        },
      });

      const id = await resolvePrimaryServiceIdForInquiry(
        prismaMock as unknown as PrismaService,
        makeSanitizedInquiryDetails({ eventTypeId: EVENT_TYPE_ID }),
      );
      expect(id).toBe(SERVICE_A);
      expect(prismaMock.eventType.findUnique.mock.calls.length).toBeGreaterThan(
        0,
      );
    });

    it('resolves via catalog event contactInquiryCode', async () => {
      const prismaMock = createPrismaMock({
        event: {
          findFirst: jest.fn().mockResolvedValue({
            eventType: { contactInquiryCode: 'PRIVATE_GALA' },
          }),
        },
        service: {
          findFirst: jest.fn().mockResolvedValue({ id: SERVICE_A }),
        },
      });

      const id = await resolvePrimaryServiceIdForInquiry(
        prismaMock as unknown as PrismaService,
        makeSanitizedInquiryDetails({ eventId: EVENT_ID }),
      );
      expect(id).toBe(SERVICE_A);
      expect(prismaMock.event.findFirst.mock.calls.length).toBeGreaterThan(0);
    });

    it('returns null when nothing resolves', async () => {
      const prismaMock = createPrismaMock({
        service: { findFirst: jest.fn().mockResolvedValue(null) },
        eventType: { findUnique: jest.fn().mockResolvedValue(null) },
        event: { findFirst: jest.fn().mockResolvedValue(null) },
      });

      const id = await resolvePrimaryServiceIdForInquiry(
        prismaMock as unknown as PrismaService,
        makeSanitizedInquiryDetails(),
      );
      expect(id).toBeNull();
    });
  });

  describe('bookingDetailsForPublicInquiry', () => {
    it('sets serviceIds to primary when empty', () => {
      const out = bookingDetailsForPublicInquiry(
        makeSanitizedInquiryDetails(),
        SERVICE_A,
      );
      expect(out.serviceIds).toEqual([SERVICE_A]);
    });

    it('moves primary to front when already listed', () => {
      const out = bookingDetailsForPublicInquiry(
        makeSanitizedInquiryDetails({
          serviceIds: [SERVICE_B, SERVICE_A],
        }),
        SERVICE_A,
      );
      expect(out.serviceIds).toEqual([SERVICE_A, SERVICE_B]);
    });
  });
});
