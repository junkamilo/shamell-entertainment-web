import type { PrismaService } from '../../../prisma/prisma.service';
import { createPrismaMock } from '../../../testing/prisma-mock';
import {
  bookingInquiryFixtureIds,
  makeEventPriceRow,
  makeSanitizedInquiryDetails,
  makeServicePriceRow,
} from '../__mocks__/booking-inquiry.fixtures';
import { computeBookingGuideInvestmentUsd } from './booking-guide-investment.util';

describe('booking-guide-investment.util', () => {
  const { SERVICE_A, SERVICE_B, EVENT_ID, EVENT_TYPE_ID } =
    bookingInquiryFixtureIds;

  it('returns null total and not partial when empty', async () => {
    const prismaMock = createPrismaMock();
    const result = await computeBookingGuideInvestmentUsd(
      prismaMock as unknown as PrismaService,
      makeSanitizedInquiryDetails(),
    );
    expect(result).toEqual({ totalUsd: null, isPartial: false });
    expect(prismaMock.event.findFirst.mock.calls).toHaveLength(0);
    expect(prismaMock.service.findMany.mock.calls).toHaveLength(0);
  });

  it('sums event and service prices', async () => {
    const prisma = createPrismaMock({
      event: {
        findFirst: jest.fn().mockResolvedValue(makeEventPriceRow(200)),
      },
      service: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            makeServicePriceRow(SERVICE_A, 100),
            makeServicePriceRow(SERVICE_B, 50.5),
          ]),
      },
    }) as unknown as PrismaService;

    const result = await computeBookingGuideInvestmentUsd(
      prisma,
      makeSanitizedInquiryDetails({
        eventId: EVENT_ID,
        serviceIds: [SERVICE_A, SERVICE_B],
      }),
    );
    expect(result).toEqual({ totalUsd: 350.5, isPartial: false });
  });

  it('marks partial when event price missing', async () => {
    const prisma = createPrismaMock({
      event: {
        findFirst: jest.fn().mockResolvedValue(makeEventPriceRow(null)),
      },
      service: {
        findMany: jest
          .fn()
          .mockResolvedValue([makeServicePriceRow(SERVICE_A, 100)]),
      },
    }) as unknown as PrismaService;

    const result = await computeBookingGuideInvestmentUsd(
      prisma,
      makeSanitizedInquiryDetails({
        eventTypeId: EVENT_TYPE_ID,
        serviceIds: [SERVICE_A],
      }),
    );
    expect(result).toEqual({ totalUsd: 100, isPartial: true });
  });

  it('marks partial when a service row is missing', async () => {
    const prisma = createPrismaMock({
      service: {
        findMany: jest
          .fn()
          .mockResolvedValue([makeServicePriceRow(SERVICE_A, 80)]),
      },
    }) as unknown as PrismaService;

    const result = await computeBookingGuideInvestmentUsd(
      prisma,
      makeSanitizedInquiryDetails({
        serviceIds: [SERVICE_A, SERVICE_B],
      }),
    );
    expect(result).toEqual({ totalUsd: 80, isPartial: true });
  });

  it('returns null total when all prices absent but flags partial', async () => {
    const prisma = createPrismaMock({
      event: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    }) as unknown as PrismaService;

    const result = await computeBookingGuideInvestmentUsd(
      prisma,
      makeSanitizedInquiryDetails({ eventId: EVENT_ID }),
    );
    expect(result).toEqual({ totalUsd: null, isPartial: true });
  });
});
